/* eslint-disable max-len */

const chalk = require('chalk')
const { bundleAmazon } = require('./bundler/amazon/index')
const { bundleGoogle } = require('./bundler/google/index')
const { getInfos } = require('./discoverer/index')
const { deployAmazon } = require('./deployer/amazon/index')
const { publishAmazon } = require('./publisher/amazon/index')
const { spinnies, log, logdev } = require('./printers/index')
const { zip } = require('./zipper/index')
const { deployGoogle, publishGoogle } = require('./deployer/google/index')
const { transpile } = require('./transpiler/index')
const schema = require('./schemas/index').hyperformJsonSchema

/**
 * 
 * @param {string} fpath Path to .js file
 */
async function bundleTranspileZipAmazon(fpath) {
  // Bundle 
  let amazonBundledCode
  try {
    amazonBundledCode = await bundleAmazon(fpath)
  } catch (e) {
    log(`Errored bundling ${fpath} for Amazon: ${e}`)
    return // just skip that file 
  }

  // Transpile 
  const amazonTranspiledCode = transpile(amazonBundledCode)

  // Zip
  try {
    const amazonZipPath = await zip(amazonTranspiledCode)
    return amazonZipPath
  } catch (e) {
    // probably underlying issue with the zipping library or OS
    // skip that file 
    log(`Errored zipping ${fpath} for Amazon: ${e}`)
  }
}

/**
 * 
 * @param {string} fpath Path to .js file
 */
async function bundleTranspileZipGoogle(fpath) {
  // Bundle 
  let googleBundledCode
  try {
    googleBundledCode = await bundleGoogle(fpath)
  } catch (e) {
    log(`Errored bundling ${fpath} for Google: ${e}`)
    return // just skip that file 
  }

  // Transpile 
  const googleTranspiledCode = transpile(googleBundledCode)

  // Zip
  try {
    const googleZipPath = await zip(googleTranspiledCode)
    return googleZipPath
  } catch (e) {
    // probably underlying issue with the zipping library or OS
    // skip that file 
    log(`Errored zipping ${fpath}: ${e}`)
  }
}

/**
 *  @description Deploys a given code .zip to AWS Lambda, and gives it a HTTP endpoint via API Gateway
 * @param {string} name 
 * @param {string} region 
 * @param {string} zipPath 
 * @param {boolean} isPublic whether to publish 
 * @returns {string?} If isPublic was true, URL of the endpoint of the Lambda
 */
async function deployPublishAmazon(name, region, zipPath, isPublic) {
  const amazonSpinnieName = `amazon-main-${name}`
  try {
    spinnies.add(amazonSpinnieName, { text: `Deploying ${name}` })

    // Deploy it
    const amazonDeployOptions = {
      name: name,
      region: region,
    }
    const amazonArn = await deployAmazon(zipPath, amazonDeployOptions)
    let amazonUrl 
    // Publish it if isPpublic
    if (isPublic === true) {
      amazonUrl = await publishAmazon(amazonArn, region)
    }
    spinnies.succ(amazonSpinnieName, { text: `🟢 ${name} ${chalk.rgb(255, 255, 255).bgWhite(amazonUrl)}` })

    // (return url)
    return amazonUrl
  } catch (e) {
    spinnies.f(amazonSpinnieName, {
      text: `Error deploying ${name}: ${e.stack}`,
    })
    logdev(e, e.stack)
    return null
  }
}

/**
 * @description Deploys and publishes a give code .zip to Google Cloud Functions
 * @param {string} name 
 * @param {string} region 
 * @param {string} project 
 * @param {string} zipPath 
 * @param {boolean} isPublic whether to publish
 * @returns {string?} If isPublic was true, URL of the Google Cloud Function 
 */
async function deployPublishGoogle(name, region, project, zipPath, isPublic) {
  const googleSpinnieName = `google-main-${name}`
  try {
    spinnies.add(googleSpinnieName, { text: `Deploying ${name}` })
    const googleOptions = {
      name: name,
      project: project, // process.env.GC_PROJECT,
      region: region, // TODO get from parsedhyperfromjson
      runtime: 'nodejs12',
    }
    const googleUrl = await deployGoogle(zipPath, googleOptions)
    
    if (isPublic === true) {
      // enables anyone with the URL to call the function
      await publishGoogle(name, project, region)
    }
    spinnies.succ(googleSpinnieName, { text: `🟢 ${name} ${chalk.rgb(255, 255, 255).bgWhite(googleUrl)}` })
    console.log('Google takes another 1 - 2m for changes to take effect')

    // return url
    return googleUrl
  } catch (e) {
    spinnies.f(googleSpinnieName, {
      text: `${chalk.rgb(255, 255, 255).bgWhite(' Google ')} ${name}: ${e.stack}`,
    })
    logdev(e, e.stack)
    return null
  }
}
/**
 * 
 * @param {string} dir 
 * @param {Regex} fnregex 
 * @param {*} parsedHyperformJson
 * @param {boolean} isPublic Controls whether (Amazon) to create URL endpoint and (Google) whether to remove IAM protection on the URL
 * @returns {{ urls: string[] }} urls: Mixed, nested Array of endpoint URLs.
 */
async function main(dir, fnregex, parsedHyperformJson, isPublic) {
  const infos = await getInfos(dir, fnregex)
  /*
    [
      {
        p: '/home/qng/dir/somefile.js',
        exps: [ 'endpoint_hello' ]
      }
    ]
  */

  // verify parsedHyperformJson (again)
  const { error, value } = schema.validate(parsedHyperformJson)
  if (error) {
    throw new Error(`${error} ${value}`)
  }

  if (infos.length === 0) {
    log(`No exports found matching ${fnregex}`)
    return [] // no endpoint URLs created
  }

  // For each file 
  //   bundle
  //   transpile 
  //   Amazon
  //     zip
  //     deployAmazon 
  //     publishAmazon  

  const endpoints = await Promise.all(
    // For each file
    infos.map(async (info) => {
      const toAmazon = parsedHyperformJson.amazon != null 
      const toGoogle = parsedHyperformJson.google != null 
      /// //////////////////////////////////////////////////////////
      // Bundle and zip for Amazon //
      /// //////////////////////////////////////////////////////////
      let amazonZipPath
      if (toAmazon === true) {
        amazonZipPath = await bundleTranspileZipAmazon(info.p)
      } 

      /// //////////////////////////////////////////////////////////
      // Bundle and zip for Google //
      /// //////////////////////////////////////////////////////////
      let googleZipPath 
      if (toGoogle === true) {
        googleZipPath = await bundleTranspileZipGoogle(info.p)
      }

      // For each matching export
      const endpts = await Promise.all(
        info.exps.map(async (exp) => {
          /// //////////////////////////////////////////////////////////
          /// Deploy to Amazon
          /// //////////////////////////////////////////////////////////
          let amazonUrl 
          if (toAmazon === true) {
            amazonUrl = await deployPublishAmazon(
              exp,
              parsedHyperformJson.amazon.aws_default_region,
              amazonZipPath,
              isPublic,
            )
          }

          /// //////////////////////////////////////////////////////////
          /// Deploy to Google
          /// //////////////////////////////////////////////////////////
          let googleUrl
          if (toGoogle === true) {
            googleUrl = await deployPublishGoogle(
              exp, 
              'us-central1', 
              'firstnodefunc', 
              googleZipPath,
              isPublic,
            )
          }
          
          return [amazonUrl, googleUrl].filter((el) => el) // for tests etc
        }),
      )

      return [].concat(...endpts)
    }),
  )
  return { urls: endpoints }
}

module.exports = {
  main,
}

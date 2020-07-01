/* eslint-disable max-len */

const chalk = require('chalk')
const clipboardy = require('clipboardy')
const { bundleAmazon } = require('./bundler/amazon/index')
const { bundleGoogle } = require('./bundler/google/index')
const { getInfos } = require('./discoverer/index')
const { deployAmazon } = require('./deployer/amazon/index')
const { publishAmazon } = require('./publisher/amazon/index')
const { generateRandomBearerToken } = require('./authorizer-gen/utils')
const { spinnies, log, logdev } = require('./printers/index')
const { zip } = require('./zipper/index')
const { deployGoogle } = require('./deployer/google/index')
const { transpile } = require('./transpiler/index')
const { isInTesting } = require('./meta/index')
const schema = require('./schemas/index').hyperformJsonSchema

/**
 * 
 * @param {string} fpath Path to .js file
 * @param {{
 * needAuth: boolean,
 * expectedBearer?: string
 * }} publishOptions 
 */
async function bundleTranspileZipAmazon(fpath, publishOptions) {
  // Bundle 
  let amazonBundledCode
  try {
    amazonBundledCode = await bundleAmazon(fpath)
  } catch (e) {
    log(`Errored bundling ${fpath} for Amazon: ${e}`)
    return // just skip that file 
  }

  // Transpile 
  const amazonTranspiledCode = transpile(amazonBundledCode, publishOptions)

  // Zip
  try {
    const amazonZipPath = await zip(amazonTranspiledCode)
    return amazonZipPath
  } catch (e) {
    // probably underlying issue with the zipping library or OS
    // should not happen
    log(`Errored zipping ${fpath} for Amazon: ${e}`)
    // skip that file 
  }
}

/**
 * 
 * @param {string} fpath Path to .js file
 * @param {{
 * needAuth: boolean,
 * expectedBearer?: string
 * }} publishOptions 
 */
async function bundleTranspileZipGoogle(fpath, publishOptions) {
  // Bundle 
  let googleBundledCode
  try {
    googleBundledCode = await bundleGoogle(fpath)
  } catch (e) {
    log(`Errored bundling ${fpath} for Google: ${e}`)
    return // just skip that file 
  }

  // Transpile 
  const googleTranspiledCode = transpile(googleBundledCode, publishOptions)

  // Zip
  try {
    const googleZipPath = await zip(googleTranspiledCode)
    return googleZipPath
  } catch (e) {
    // probably underlying issue with the zipping library or OS
    // should not happen
    log(`Errored zipping ${fpath}: ${e}`)
    // skip that file 
  }
}

/**
 *  @description Deploys and publishes a given code .zip to AWS Lambda
 * @param {string} name 
 * @param {string} region 
 * @param {string} zipPath 
 * @param {{
 * needAuth: boolean, 
 * expectedBearer?: string
 * region: string
 * }} publishOptions 
 * @returns {string} URL of the endpoint of the Lambda
 */
async function deployPublishAmazon(name, region, zipPath, publishOptions) {
  const amazonSpinnieName = `amazon-main-${name}`
  try {
    spinnies.add(amazonSpinnieName, { text: `${chalk.rgb(255, 255, 255).bgWhite(' AWS Lambda ')} Deploying ${name}` })

    // Deploy it
    const amazonDeployOptions = {
      name: name,
      region: region,
    }
    const amazonArn = await deployAmazon(zipPath, amazonDeployOptions)
    // Publish it
    const amazonPublishOptions = {
      ...publishOptions, // needAuth and expectedBearer
      region: region,
    }
    const amazonUrl = await publishAmazon(amazonArn, amazonPublishOptions)
    spinnies.succeed(amazonSpinnieName, { text: `${chalk.rgb(255, 255, 255).bgWhite(' AWS Lambda ')} 🟢 ${name} ${chalk.rgb(255, 255, 255).bgWhite(amazonUrl)}` })

    // return url 
    return amazonUrl
  } catch (e) {
    spinnies.fail(amazonSpinnieName, {
      text: `${chalk.rgb(255, 255, 255).bgWhite(' AWS Lambda ')} Error deploying ${name}: ${e.stack}`,
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
 * @returns {string} URL of the Google Cloud Function 
 */
async function deployPublishGoogle(name, region, project, zipPath) {
  const googleSpinnieName = `google-main-${name}`
  try {
    spinnies.add(googleSpinnieName, { text: `${chalk.rgb(255, 255, 255).bgWhite(' Google ')} ${name}` })
    const googleOptions = {
      name: name,
      project: project, // process.env.GC_PROJECT,
      region: region, // TODO get from parsedhyperfromjson
      runtime: 'nodejs12',
    }
    const googleUrl = await deployGoogle(zipPath, googleOptions)
    spinnies.succeed(googleSpinnieName, { text: `${chalk.rgb(255, 255, 255).bgWhite(' Google ')} ${name} ${chalk.rgb(255, 255, 255).bgWhite(googleUrl)}` })
    console.log('Google takes another 1 - 2m for changes to take effect')

    // return url
    return googleUrl
  } catch (e) {
    spinnies.fail(googleSpinnieName, {
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
 * @param {boolean} needAuth
 * @returns {{ urls: string[], expectedBearer?: string }} urls: Mixed, nested Array of endpoint URLs. 
 * expectedBearer: if needAuth was true, the Bearer token needed to invoke the Fn.
 * @throws
 */
async function main(dir, fnregex, parsedHyperformJson, needAuth) {
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

  // options passed to (transpile (for google)) and publishAmazon (for amazon)
  const publishOptions = {
    needAuth: needAuth,
  }
  if (needAuth === true) {
    publishOptions.expectedBearer = generateRandomBearerToken()
    // Print bearer token in console
    // and copy to clipboard if not in testing
    let bearerStdout = `Authorization: Bearer ${chalk.bold(publishOptions.expectedBearer)}`
    if (isInTesting() === false) {
      try {
        await clipboardy.write(publishOptions.expectedBearer)
        bearerStdout += ` ${chalk.rgb(175, 175, 175)('(Copied)')}`
      } catch (e) {
        /* Not the end of the world */
      }
    }
    log(bearerStdout)
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
        amazonZipPath = await bundleTranspileZipAmazon(info.p, publishOptions)
      } 

      /// //////////////////////////////////////////////////////////
      // Bundle and zip for Google //
      /// //////////////////////////////////////////////////////////
      let googleZipPath 
      if (toGoogle === true) {
        googleZipPath = await bundleTranspileZipGoogle(info.p, publishOptions)
      }

      // NOTE for new functions add allUsers as invoker
      // Keep that for now so don't forget the CLI setInvoker thing may screw up --need-authentication

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
              publishOptions,
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
            )
          }
          
          return [amazonUrl, googleUrl].filter((el) => el) // for tests etc
        }),
      )

      return [].concat(...endpts)
    }),
  )
  return { urls: endpoints, expectedBearer: publishOptions.expectedBearer }
}

module.exports = {
  main,
}

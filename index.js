/* eslint-disable max-len */

const chalk = require('chalk')
const clipboardy = require('clipboardy')
const { bundle } = require('./bundler/index')
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
 * @param {string} dir 
 * @param {Regex} fnregex 
 * @param {*} parsedHyperformJson
 * @param {boolean} allowUnauthenticated
 * @returns {string[]} Mixed, nested list of endpoint URLs
 * @throws
 */
async function main(dir, fnregex, parsedHyperformJson, allowUnauthenticated) {
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
    allowUnauthenticated: allowUnauthenticated,
  }
  if (allowUnauthenticated === false) {
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
      let bundledCode
      try {
        bundledCode = await bundle(info.p)
      } catch (e) {
        log(`Errored bundling ${info.p}: ${e}`)
        return // just skip that file 
      }
      const transpiledCode = transpile(bundledCode, publishOptions)
  
      // For Amazon
      let zipPath
      try {
        zipPath = await zip(transpiledCode)
      } catch (e) {
        // probably underlying issue with the zipping library or OS
        // should not happen
        log(`Errored zipping ${info.p}: ${e}`)
        return // skip that file 
      }
  
      // NOTE for new functions add allUsers as invoker
      // Keep that for now so don't forget the CLI setInvoker thing may screw up --allow-unauthenticated

      // For each matching export
      const endpts = await Promise.all(
        info.exps.map(async (exp) => {
          /// //////////////////////////////////////////////////////////
          /// Deploy to Amazon
          /// //////////////////////////////////////////////////////////
          let amazonUrl 
          {
            const amazonSpinnieName = `amazon-main-${exp}`
            try {
              spinnies.add(amazonSpinnieName, { text: `${chalk.rgb(20, 20, 20).bgWhite(' Amazon ')} ${exp}` })
    
              // Deploy it
              const amazonDeployOptions = {
                name: exp,
                region: parsedHyperformJson.amazon.aws_default_region,
              }
              const amazonArn = await deployAmazon(zipPath, amazonDeployOptions)
              // Publish it
              const amazonPublishOptions = {
                ...publishOptions, // allowUnauthenticated and expectedBearer
                region: parsedHyperformJson.amazon.aws_default_region,
              }
              amazonUrl = await publishAmazon(amazonArn, amazonPublishOptions) // TODO
               
              spinnies.succeed(amazonSpinnieName, { text: `${chalk.rgb(20, 20, 20).bgWhite(' Amazon ')} ${exp} ${chalk.bold(amazonUrl)}` })
            } catch (e) {
              spinnies.fail(amazonSpinnieName, {
                text: `${chalk.rgb(20, 20, 20).bgWhite(' Amazon ')} ${exp}: ${e.stack}`,
              })
              logdev(e, e.stack)
            }
          }

          // TODO
          /// //////////////////////////////////////////////////////////
          /// Deploy to Google
          /// //////////////////////////////////////////////////////////
          let googleUrl 
          {
            const googleSpinnieName = `google-main-${exp}`
            try {
              spinnies.add(googleSpinnieName, { text: `${chalk.rgb(20, 20, 20).bgWhite(' Google ')} ${exp}` })
              const googleOptions = { 
                name: exp,
                project: 'firstnodefunc', // TODO TODO TODO
                region: 'us-central1', // TODO get from parsedhyperfromjson
                runtime: 'nodejs12',
                entrypoint: exp,
              }
              googleUrl = await deployGoogle(zipPath, googleOptions)
              spinnies.succeed(googleSpinnieName, { text: `${chalk.rgb(20, 20, 20).bgWhite(' Google ')} ${exp} ${chalk.bold(googleUrl)}` })
            } catch (e) {
              spinnies.fail(googleSpinnieName, {
                text: `${chalk.rgb(20, 20, 20).bgWhite(' Google ')} ${exp}: ${e.stack}`,
              })
              logdev(e, e.stack)
            }
          }

          return [amazonUrl, googleUrl] // for tests etc
        }),
      )

      return [].concat(...endpts)
    }),
  )
  return endpoints
}

module.exports = {
  main,
}

/* eslint-disable max-len */
const uuidv4 = require('uuid').v4
const path = require('path')
const os = require('os')
const fsp = require('fs').promises
const chalk = require('chalk')
const clipboardy = require('clipboardy')
const { bundle } = require('./bundler/index')
const { getInfos } = require('./discoverer/index')
const { deployAmazon } = require('./deployer/amazon/index')
const { deployGoogle } = require('./deployer/google/index')
const { publishAmazon } = require('./publisher/amazon/index')
const { generateRandomBearerToken } = require('./authorizer-gen/utils')
const { spinnies } = require('./printers/index')
const { zip } = require('./zipper/index')
const { transpile } = require('./transpiler/index')
const { uploadAmazon } = require('./uploader/amazon')
const zipper = require('./zipper/index')
const { uploadGoogle } = require('./uploader/google/index')

// async function amazonMain(info, bundledCode, bearerToken, parsedHyperformJson) {
//   // Prepare uploadable
//   const zipPath = await zip(bundledCode)

//   // for every named fn_ export, deploy the zip 
//   // with correct handler
//   const amazonEndpoints = await Promise.all(
//     info.exps.map(async (exp) => { 
//       const name = exp
//       // const spinnieName = `amazon-${name}`
//       // spinnies.add(spinnieName, {
//       //   text: `${chalk.rgb(20, 20, 20).bgWhite(' Amazon ')} ${name}`,
//       // })

//       /// //////////////
//       // DEPLOY
//       /// //////////////

//       const amazonDeployOptions = {
//         name: name,
//         region: parsedHyperformJson.amazon.aws_default_region,
//       }
//       // deploy function
//       const amazonArn = await deployAmazon(zipPath, amazonDeployOptions)

//       /// //////////////
//       // PUBLISH
//       /// //////////////

//       const amazonPublishOptions = {
//         allowUnauthenticated: false, 
//         bearerToken: bearerToken,
//         region: parsedHyperformJson.amazon.aws_default_region,
//       }

//       // TODO split methods so no coincidental mixup of public and private (?)
//       const amazonEndpoint = await publishAmazon(amazonArn, amazonPublishOptions)

//       // TODO do somewhere else
//       // TODO group by endpoint, not provider
//       // spinnies.succeed(spinnieName, {
//       //   text: `${chalk.rgb(20, 20, 20).bgWhite(' Amazon ')} ${name} ${chalk.bold(amazonEndpoint)}`,
//       // })

//       return amazonEndpoint
//     }),
//   )

//   return amazonEndpoints
// }

// /* Does not use bearerToken, it's already baked into bundledCode */

// async function googleMain(info, bundledCode, bearerToken, parsedHyperformJson) {
//   // Prepare uploadable
//   const tmpdir = path.join(
//     os.tmpdir(),
//     uuidv4(),
//   )
//   await fsp.mkdir(tmpdir)
//   // write code to there as file
//   await fsp.writeFile(
//     path.join(tmpdir, 'index.js'),
//     bundledCode,
//     { encoding: 'utf-8' },
//   )

//   // for every named fn_ export, deploy the folder 
//   // with correct handler
//   const googleEndpoints = await Promise.all(
//     info.exps.map(async (exp) => { // under same name
//       const name = exp 
//       // const spinnieName = `google-${name}`
//       // spinnies.add(spinnieName, {
//       //   text: `${chalk.rgb(20, 20, 20).bgWhite(' Google ')} ${name}`,
//       // })

//       /// //////////////
//       // DEPLOY
//       /// //////////////
//       const googleDeployOptions = {
//         name: name,
//         stagebucket: 'jak-functions-stage-bucket',
//       }
//       const googleEndpoint = await deployGoogle(tmpdir, googleDeployOptions)

//       // spinnies.succeed(spinnieName, {
//       //   text: `${chalk.rgb(20, 20, 20).bgWhite(' Google ')} ${name} ${chalk.bold(googleEndpoint)}`,
//       // })

//       return googleEndpoint
//       // TODO do somewhere else
//       // TODO delete file & tmpdir
//     }),
//   )

//   return googleEndpoints
// }

/**
 * 
 * @param {string} dir 
 * @param {Regex} fnregex 
 * @param {*} parsedHyperformJson
 * @throws
 */
async function main(dir, fnregex, parsedHyperformJson) {
  const infos = await getInfos(dir, fnregex)

  if (infos.length === 0) {
    console.log(`No exports found matching ${fnregex}`)
    return null
  }

  // generate beearer token 
  const expectedBearer = generateRandomBearerToken()

  const endpoints = await Promise.all(
    // for each file
    infos.map(async (info) => {
      const bundledCode = await bundle(info.p)
      const transpiledCode = transpile(bundledCode, expectedBearer)
      // for amazon
      const zipPath = await zip(transpiledCode)

      // for google
      const tmpdir = await fsp.mkdtemp(path.join(os.tmpdir(), 'bundle-'))
      await fsp.writeFile(path.join(tmpdir, 'index.js'), transpiledCode, { encoding: 'utf-8' })

      // const gsKey = `deploypackage-${uuidv4()}.zip`
      // const gsPath = await uploadGoogle(zipPath, 'jak-functions-stage-bucket', gsKey)

      // for each matching export

      // NOTE for new functions add allUsers as invoker
      // Keep that for now so don't forget the CLI setInvoker thing may screw up --allow-unauthenticated
      const endpts = await Promise.all(
        info.exps.map(async (exp) => {
          try {
            console.log(zipPath, exp, expectedBearer)
            const amazonArn = await deployAmazon(zipPath, { name: exp, region: 'us-east-2' })
            const amazonUrl = await publishAmazon(amazonArn, { allowUnauthenticated: false, region: 'us-east-2', bearerToken: expectedBearer })
            console.log(amazonUrl)
            const googleUrl = await deployGoogle(tmpdir, { name: exp, stagebucket: 'jak-functions-stage-bucket' })
            console.log(googleUrl)
            return [amazonUrl, googleUrl]
          } catch (e) {
            console.log(`Errored: ${e}`)
            return []
          }
        }),
      )

      return [].concat(...endpts)
    }),
  )

  console.log(endpoints)

  return endpoints
  /*
          [
            {
              p: '/home/qng/cloudkernel/recruiter/lambs/hmm.js',
              exps: [ 'fn_' ]
            }
          ]
      */
  // // read, transpile, bundle, deploy each info
  // const endpoints = await Promise.all(
  //   infos.map(async (info) => {
  //     // bundle file
  //     const bundledCode = await bundle(info.p)

  //     // add module append
  //     // use one token for all endpoints (derweil)
  //     // TODO generate token from terminal seed 
  //     const bearerToken = generateRandomBearerToken(/* TODO ?SEED */)
  //     // Hardcode expected token into function (for Google)
  //     const transpiledCode = transpile(bundledCode, bearerToken)

  //     // TODO mach parallel und do spinnies woanders (eh besser), sollte auch wrapping lösen
  //     // nicht wichtig

  //     // Try to copy token to clipboard
  //     let tokenMsg = `Authorization: Bearer ${chalk.bold(bearerToken)}`
  //     try {
  //       await clipboardy.write(bearerToken)
  //       // success
  //       tokenMsg += ` ${chalk.rgb(175, 175, 175)('(Copied)')}`
  //     } catch (e) {
  //       // fail - not the end of the world
  //     }
  //     // Print token to console
  //     console.log(tokenMsg)

  //     // Deploy and publish

  //     const [amazonEndpoints, googleEndpoints] = await Promise.all([
  //       /// ///////////////////
  //       // Amazon
  //       /// ///////////////////
  //       amazonMain(info, transpiledCode, bearerToken, parsedHyperformJson),

  //       /// ///////////////////
  //       // Google
  //       /// ///////////////////

  //       // NOTE for new functions add allUsers as invoker
  //       // Keep that for now so don't forget the CLI setInvoker thing may screw up --allow-unauthenticated
  //       googleMain(info, transpiledCode, bearerToken, parsedHyperformJson),
  //     ])
  //     // TODO .catch here catches aamzonMain or GoogleMain throwing
  //     // But seemingly does not propagate up to top-level boundary

  //     // just for tests
  //     return [...amazonEndpoints, ...googleEndpoints]
  //   }),
  // )

  // return endpoints
}

module.exports = {
  main,
}

/* eslint-disable max-len */

const chalk = require('chalk')
const clipboardy = require('clipboardy')
const { bundle } = require('./bundler/index')
const { getInfos } = require('./discoverer/index')
const { deployAmazon } = require('./deployer/amazon/index')
const { publishAmazon } = require('./publisher/amazon/index')
const { generateRandomBearerToken } = require('./authorizer-gen/utils')
const { spinnies } = require('./printers/index')
const { zip } = require('./zipper/index')
const { transpile } = require('./transpiler/index')

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

  if (infos.length === 0) {
    console.log(`No exports found matching ${fnregex}`)
    return [] // no endpoint URLs created
  }

  // passed to (transpile (for google)) and publishAmazon (for amazon)
  const publishOptions = {
    allowUnauthenticated: allowUnauthenticated,
  }
  if (allowUnauthenticated === false) {
    publishOptions.expectedBearer = generateRandomBearerToken()
  }

  const endpoints = await Promise.all(
    // for each file
    infos.map(async (info) => {
      let bundledCode
      try {
        bundledCode = await bundle(info.p)
      } catch (e) {
        console.log(`Errored bundling ${info.p}: ${e}`)
        return // skip that file 
      }
      const transpiledCode = transpile(bundledCode, publishOptions)
  
      // For Amazon
      let zipPath
      try {
        zipPath = await zip(transpiledCode)
      } catch (e) {
        // probably underlying issue with the zipping library or OS
        // should not happen
        console.log(`Errored zipping ${info.p}: ${e}`)
        return // skip that file 
      }

      // For Google
      // const tmpdir = await fsp.mkdtemp(path.join(os.tmpdir(), 'bundle-'))
      // await fsp.writeFile(path.join(tmpdir, 'index.js'), transpiledCode, { encoding: 'utf-8' })

      // const gsKey = `deploypackage-${uuidv4()}.zip`
      // const gsPath = await uploadGoogle(zipPath, 'jak-functions-stage-bucket', gsKey)

      // for each matching export
      // NOTE for new functions add allUsers as invoker
      // Keep that for now so don't forget the CLI setInvoker thing may screw up --allow-unauthenticated
      const endpts = await Promise.all(
        info.exps.map(async (exp) => {
          const spinnieName = `amazon-main-${exp}`
          try {
            console.log(`Authorization: Bearer ${chalk.bold(publishOptions.expectedBearer)}`)
            spinnies.add(spinnieName, { text: `${chalk.rgb(20, 20, 20).bgWhite(' Amazon ')} ${exp}` })

            const amazonArn = await deployAmazon(zipPath, {
              name: exp,
              region: parsedHyperformJson.amazon.aws_default_region,
            })
            const amazonUrl = await publishAmazon(amazonArn, {
              ...publishOptions, // allowUnauthenticated and expectedBearer
              region: parsedHyperformJson.amazon.aws_default_region,
            }) // TODO
            spinnies.succeed(spinnieName, { text: `${chalk.rgb(20, 20, 20).bgWhite(' Amazon ')} ${exp} ${chalk.bold(amazonUrl)}` })

            // const googleUrl = await deployGoogle(tmpdir, { 
            //   name: exp, 
            //   stagebucket: 'jak-functions-stage-bucket', 
            // })
            // console.log(googleUrl)
            return [amazonUrl] // for tests etc
            // 
          } catch (e) {
            spinnies.fail(spinnieName, {
              text: `${chalk.rgb(20, 20, 20).bgWhite(' Amazon ')} ${exp}: ${e}`,
            })
            return []
          }
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

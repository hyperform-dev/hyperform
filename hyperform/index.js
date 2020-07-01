/* eslint-disable max-len */
const uuidv4 = require('uuid').v4
const path = require('path')
const os = require('os')
const fsp = require('fs').promises
const chalk = require('chalk')
const clipboardy = require('clipboardy')
const { bundle } = require('./bundler/index')
const { getJsFilepaths, getNamedExportKeys } = require('./discoverer/index')
const { deployAmazon } = require('./deployer/amazon/index')
const { generateRandomBearerToken } = require('./authorizer-gen/utils')
const { publishAmazon } = require('./publisher/amazon/index')
const { deployGoogle } = require('./deployer/google/index')
const { spinnies } = require('./printers/index')
const { zip } = require('./zipper/index')

function createAppendix(expectedToken) {
  return (`

  ;module.exports = (() => {
  


    // for lambda, wrap all exports in context.succeed
    /**
     * 
     * @param {*} moduleexports 
     * @param {string} platform amazon | google
     */
    function wrapExports(moduleexports, platform) {
      const newmoduleexports = { ...moduleexports };
      const expkeys = Object.keys(moduleexports)
  
      for (let i = 0; i < expkeys.length; i += 1) {
        const expkey = expkeys[i]
        const userfunc = newmoduleexports[expkey]
        // if we process same export twice for some reason
        // it should be idempotent
        if (userfunc.hyperform_wrapped === true) {
          continue
        }
  
        let wrappedfunc
        if(platform === 'amazon') {
          wrappedfunc = async function handler(input, context) {
            let event = null // that way, no event is included in a simple echo (when undefined, the field simply does not appear marshalled)
            //https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html
            
            // TODO support plain inputs
            // try to parse as json, otherwise just pass 
            // 1 => "1", "abc" => "abc", '{"a":1}' => { a: 1}
            if(input.body) {
              event = (input.isBase64Encoded === true)
                ? JSON.parse( Buffer.from(input.body, 'base64').toString('utf-8') )
                : JSON.parse(input.body) // TODO throw invalid input code if could not decode
                // TODO generally a way to throw HTTP status codes
                
            } else {
              console.log("No 'body' field found in input.") //TODO remove
            }
            const res = await userfunc(event, context) // todo add context.fail // todo don't pass context otherwise usercode might become amz flavored
            context.succeed(res)
          }
        } 
        if(platform === 'google') {
          wrappedfunc = async function handler(req, resp) {
            if (!req.headers.authorization || req.headers.authorization !== 'Bearer ${expectedToken}') {
              // unauthorized, exit
              return resp.sendStatus(403)
            }
            const input = JSON.parse(JSON.stringify(req.body)) // get rid of prototype methods of req.body
            const output = await userfunc(input) // TODO add fail 500
            resp.json(output)
          }
        }
  
        wrappedfunc.hyperform_wrapped = true
        newmoduleexports[expkey] = wrappedfunc
      }
  
      return newmoduleexports
    }
  
    
    const curr = { ...exports, ...module.exports }
  
    const isInAmazon = !!(process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV)
    const isInGoogle = (/google/.test(process.env._) === true)
  
    if(isInAmazon === true) {
      const newmoduleexp = wrapExports(curr, 'amazon')
      return newmoduleexp
    }
  
    if(isInGoogle === true) {
      const newmoduleexp = wrapExports(curr, 'google')
      return newmoduleexp
    }
  
    return curr; // Export unchanged (local, fallback)
  
    
  
  })();
  
  `)
}

/**
 * Scouts <dir> and its subdirectories for .js files with exports whose name matches <fnregex>
 * @param {string} dir 
 * @param {Regex} fnregex 
 * @returns {[ { p: string, exps: string[] } ]} Array of "p" (path to js file) and its named exports that match fnregex ("exps")
 */
async function getInfos(dir, fnregex) {
  const infos = (await getJsFilepaths(dir))
    .map((p) => ({
      p: p,
      exps: getNamedExportKeys(p),
    }))
    // skip files that don't have named exports
    .filter(({ exps }) => exps != null && exps.length > 0)
    // skip files that don't have named exports that fit fnregex
    .filter(({ exps }) => exps.some((exp) => fnregex.test(exp) === true))
    // filter out exports that don't fit fnregex
    .map((el) => ({ ...el, exps: el.exps.filter((exp) => fnregex.test(exp) === true) }))

  /*
      [
        {
          p: '/home/user/codes/file.js',
          exps: [ 'endpoint_hello' ]
        }
      ]
  */

  return infos
}

async function amazonMain(info, bundledCode, bearerToken, parsedHyperformJson) {
  // Prepare uploadable
  const zipPath = await zip(bundledCode)
  
  // for every named fn_ export, deploy the zip 
  // with correct handler
  const amazonEndpoints = await Promise.all(
    info.exps.map(async (exp) => { 
      const name = exp
      const spinnieName = `amazon-${name}`
      spinnies.add(spinnieName, {
        text: `${chalk.rgb(20, 20, 20).bgWhite(' Amazon ')} ${name}`,
      })

      /// //////////////
      // DEPLOY
      /// //////////////

      const amazonDeployOptions = {
        name: name,
        region: parsedHyperformJson.amazon.aws_default_region,
      }
      // deploy function
      const amazonArn = await deployAmazon(zipPath, amazonDeployOptions)

      /// //////////////
      // PUBLISH
      /// //////////////

      const amazonPublishOptions = {
        allowUnauthenticated: false, 
        bearerToken: bearerToken,
        region: parsedHyperformJson.amazon.aws_default_region,
      }

      // TODO split methods so no coincidental mixup of public and private (?)
      const amazonEndpoint = await publishAmazon(amazonArn, amazonPublishOptions)

      // TODO do somewhere else
      // TODO group by endpoint, not provider
      spinnies.succeed(spinnieName, {
        text: `${chalk.rgb(20, 20, 20).bgWhite(' Amazon ')} ${name} ${chalk.bold(amazonEndpoint)}`,
      })

      return amazonEndpoint
    }),
  )

  return amazonEndpoints
}

/* Does not use bearerToken, it's already baked into bundledCode */

async function googleMain(info, bundledCode, bearerToken, parsedHyperformJson) {
  // Prepare uploadable
  const tmpdir = path.join(
    os.tmpdir(),
    uuidv4(),
  )
  await fsp.mkdir(tmpdir)
  // write code to there as file
  await fsp.writeFile(
    path.join(tmpdir, 'index.js'),
    bundledCode,
    { encoding: 'utf-8' },
  )

  // for every named fn_ export, deploy the folder 
  // with correct handler
  const googleEndpoints = await Promise.all(
    info.exps.map(async (exp) => { // under same name
      const name = exp 
      const spinnieName = `google-${name}`
      spinnies.add(spinnieName, {
        text: `${chalk.rgb(20, 20, 20).bgWhite(' Google ')} ${name}`,
      })
      
      /// //////////////
      // DEPLOY
      /// //////////////
      const googleDeployOptions = {
        name: name,
        stagebucket: 'jak-functions-stage-bucket',
      }
      const googleEndpoint = await deployGoogle(tmpdir, googleDeployOptions)

      spinnies.succeed(spinnieName, {
        text: `${chalk.rgb(20, 20, 20).bgWhite(' Google ')} ${name} ${chalk.bold(googleEndpoint)}`,
      })

      return googleEndpoint
      // TODO do somewhere else
      // TODO delete file & tmpdir
    }),
  )

  return googleEndpoints
}

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
    return 
  }
  /*
          [
            {
              p: '/home/qng/cloudkernel/recruiter/lambs/hmm.js',
              exps: [ 'fn_' ]
            }
          ]
      */
  // read, transpile, bundle, deploy each info
  const endpoints = await Promise.all(
    infos.map(async (info) => {
      // bundle file
      let bundledCode = await bundle(info.p)

      // add module append
      // use one token for all endpoints (derweil)
      // TODO generate token from terminal seed 
      const bearerToken = generateRandomBearerToken(/* TODO ?SEED */)
      // Hardcode expected token into function (for Google)
      const appendix = createAppendix(bearerToken)

      bundledCode += appendix

      // TODO mach parallel und do spinnies woanders (eh besser), sollte auch wrapping lösen
      // nicht wichtig

      // Try to copy token to clipboard
      let tokenMsg = `Authorization: Bearer ${chalk.bold(bearerToken)}`
      try {
        await clipboardy.write(bearerToken)
        // success
        tokenMsg += ` ${chalk.rgb(175, 175, 175)('(Copied)')}`
      } catch (e) {
        // fail - not the end of the world
      }
      // Print token to console
      console.log(tokenMsg)

      // Deploy and publish

      const [amazonEndpoints, googleEndpoints] = await Promise.all([
        /// ///////////////////
        // Amazon
        /// ///////////////////
        amazonMain(info, bundledCode, bearerToken, parsedHyperformJson),

        /// ///////////////////
        // Google
        /// ///////////////////

        // NOTE for new functions add allUsers as invoker
        // Keep that for now so don't forget the CLI setInvoker thing may screw up --allow-unauthenticated
        googleMain(info, bundledCode, bearerToken, parsedHyperformJson),
      ])
      // TODO .catch here catches aamzonMain or GoogleMain throwing
      // But seemingly does not propagate up to top-level boundary

      // just for tests
      return [...amazonEndpoints, ...googleEndpoints]
    }),
  )

  return endpoints
}

module.exports = {
  main,
}

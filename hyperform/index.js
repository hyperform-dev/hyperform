const uuidv4 = require('uuid').v4
const path = require('path')
const os = require('os')
const fsp = require('fs').promises
const chalk = require('chalk')
const { bundle } = require('./bundler/index')
const { getJsFilepaths, getNamedExports } = require('./discoverer/index')
const { deployAmazon } = require('./deployer/amazon/index')
const { publishAmazon } = require('./publisher/amazon/index')
const { deployGoogle } = require('./deployer/google/index')
const { spinnies } = require('./printers/index')
const { zip } = require('./zipper/index')

// in lambda : export normally, but wrap in context.succeed (idempotent)
// in local: export normally

// TODO all this

const appendix = `

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
        wrappedfunc = async function handler(event, context) {
          const res = await userfunc(event, context) // todo add context.fail // todo don't pass context otherwise usercode might become amz flavored
          context.succeed(res)
        }
      } 
      if(platform === 'google') {
        wrappedfunc = async function handler(req, resp) {
          if (!req.headers.authorization || req.headers.authorization !== 'Bearer abcde') {
            // unauthorized, exit
            return resp.sendStatus(403)
          }
          // authorized
          const res = await userfunc(req.body) // TODO add fail 500
          resp.json(res)
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

`

/**
 * 
 * @param {string} dir 
 * @param {Regex} fnregex 
 */
async function main(dir, fnregex) {
  // Top-level error boundary
  try {
    // [ { p: /home/file.js, exps: ['fn_1', 'fn_2'] }, ... ]
    const infos = (await getJsFilepaths(dir))
      .map((p) => ({
        p: p,
        exps: getNamedExports(p),
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
              p: '/home/qng/cloudkernel/recruiter/lambs/hmm.js',
              exps: [ 'fn_' ]
            }
          ]
      */
    // read, transpile, bundle, deploy each p as exps
    await infos.map(async (info) => {
      // bundle file
      let bundledCode = await bundle(info.p)
  
      // add module append
      bundledCode += appendix
  
      /// ///////////////////
      // Amazon
      /// ///////////////////
      {
        // zip it
        const zipPath = await zip(bundledCode)
  
        // for every named fn_ export, deploy the zip 
        // with correct handler
        await Promise.all(
          info.exps.map(async (exp) => { // under same name
            const amazonOptions = {
              name: exp,
              // handler is always the same
              role: 'arn:aws:iam::735406098573:role/lambdaexecute',
            }
  
            //   console.log(`Amazon: Deploying ${zipPath} as ${amazonOptions.name}`)
            spinnies.add(amazonOptions.name, { 
              text: `${chalk.rgb(20, 20, 20).bgWhite(' Amazon ')} ${amazonOptions.name}`,
            
            })
  
            // deploy function
            const amazonArn = await deployAmazon(zipPath, amazonOptions)
            // is public
            // TODO split methods so no coincidental mixup of public and private
            const { url, token } = await publishAmazon(amazonArn, {
              allowUnauthenticated: false,
            })

            console.log(`Token that will be needed: ${token}`)
            spinnies.succeed(amazonOptions.name, { 
              text: `${chalk.rgb(20, 20, 20).bgWhite(' Amazon ')} ${chalk.bold(url)}`,
            })
          }),
        )
      }
  
      /// ///////////////////
      // Google
      /// ///////////////////
  
      {
        // create temporary directory
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
        await Promise.all(
          info.exps.map(async (exp) => { // under same name
            const googleOptions = {
              name: exp,
              entrypoint: exp,
              stagebucket: 'jak-functions-stage-bucket',
            }
      
            spinnies.add(googleOptions.name, { 
              text: `${chalk.rgb(20, 20, 20).bgWhite(' Google ')} ${googleOptions.name}`,
            })
            
            const googleEndpoint = await deployGoogle(tmpdir, googleOptions)
  
            spinnies.succeed(googleOptions.name, { 
              text: `${chalk.rgb(20, 20, 20).bgWhite(' Google ')} ${chalk.bold(googleEndpoint)}`,
            })
            // TODO delete file & tmpdir
          }),
        )
      }
    })
  } catch (e) {
    console.error(e)
    process.exit(1) // stop spinnies etc
  }
}

module.exports = {
  main,
}

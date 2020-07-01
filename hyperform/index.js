/* eslint-disable global-require, import/no-dynamic-require */

const { bundle } = require('./bundler/index')
const { getFilePaths, getNamedExports } = require('./discoverer/index')
const { deployAmazon } = require('./deployer/amazon/index')
const { zip } = require('./zipper/index')

// in lambda : export normally, but wrap in context.succeed (idempotent)
// in local: export normally
// in local --cloud: export als envoy

// TODO all this

const appendix = `

;module.exports = (() => {

  // for lambda, wrap all exports in context.succeed
  function wrapExports(moduleexports) {
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
      const wrappedfunc = async function handler(event, context) {
        const res = await userfunc(event, context) // todo add context.fail // todo don't pass context otherwise usercode might become amz flavored
        context.succeed(res)
      }
      wrappedfunc.hyperform_wrapped = true
      newmoduleexports[expkey] = wrappedfunc
    }

    return newmoduleexports
  }

  
  const curr = { ...exports, ...module.exports }

  const isInLambda = !!(process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV)
  const shouldWrapExports = isInLambda

  console.log('need to wrap exports: ', shouldWrapExports)

  // in Lambda : wrap
  if (shouldWrapExports === true) {
    const newmoduleexp = wrapExports(curr)
    return newmoduleexp
  }

  return curr; // Export unchanged (fallback, no flag)

})();

`

const REGION = 'us-east-2'

async function main(dir, fnregex) {
  // [ { p: /home/file.js, exps: ['fn_1', 'fn_2'] }, ... ]
  const infos = (await getFilePaths(dir, 'js'))
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
    
    // zip it
    const zipPath = await zip(bundledCode)

    // for every named fn_ export, deploy the zip 
    // with correct handler
    await Promise.all(
      info.exps.map(async (exp) => { // under same name
        const handler = `index.${exp}`
        console.log(`Deploying ${zipPath} as ${exp} with handler ${handler}`)
        await deployAmazon(zipPath, exp, handler, REGION)
      }),
    )
  })
}

main('/home/qng/cloudkernel/hyperform/lambs', /^endpoint_/)

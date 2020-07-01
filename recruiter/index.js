/* eslint-disable global-require, import/no-dynamic-require */

const { bundle } = require('./bundler/index')
const { getFilePaths, getNamedExports } = require('./discoverer/index')
const { deployAmazon } = require('./deployer/amazon/index')
const { zip } = require('./zipper/index')

// in lambda : export normally, but wrap in context.succeed (idempotent)
// in local: export normally
// in local --cloud: export als envoy

const appendix = `

;module.exports = (() => {
  const aws = require('aws-sdk')
  const lambda = new aws.Lambda({ region: 'us-east-2' })
  function envoy(name, input) {
    const uid = Math.ceil(Math.random() * 1000) + ""
    console.time("envoy-" + uid)
    const jsonInput = JSON.stringify(input)
    return (
      lambda.invoke({
        FunctionName: name,
        Payload: jsonInput,
        LogType: 'Tail',
      })
        .promise()
        // 1) Check if function succeeded
        .then((p) => {
          if (p && p.FunctionError) {
            throw new Error("Function " + name + " failed: " + p.Payload)
          }
          console.timeEnd("envoy-" + uid)
          return p
        })
        .then((p) => p.Payload)
        .then((p) => JSON.parse(p))
    )
  }

  // for lambda, wrap all exports in context.succeed
  function wrapExports(moduleexports) {
    const newmoduleexports = { ...moduleexports };
    const expkeys = Object.keys(moduleexports)

    for (let i = 0; i < expkeys.length; i += 1) {
      const expkey = expkeys[i]
      const userfunc = newmoduleexports[expkey]
      const wrappedfunc = async function handler(event, context) {
        const res = await userfunc(event, context) // todo add context.fail
        context.succeed(res)
      }
      newmoduleexports[expkey] = wrappedfunc
    }

    return newmoduleexports
  }

  // for --cloud
  function convExports(moduleexports) {
    const newmoduleexports = { ...moduleexports };
    const fn_expkeys = Object.keys(moduleexports).filter((k) => (/fn_/.test(k) === true))

    // for each fn_ export
    for (let i = 0; i < fn_expkeys.length; i += 1) {
      // replace it with envoy version
      const fn_expkey = fn_expkeys[i]
      console.log('changing ', fn_expkey)
      newmoduleexports[fn_expkey] = (...args) => envoy(fn_expkey, ...args)
    }

    return newmoduleexports;
  }

  const curr = { ...module.exports }

  console.log(Object.keys(curr))
  const isExportingFns = Object.keys(curr).some((k) => (/fn_/.test(k) === true))
  const isInLambda = !!(process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV)
  const isCloudFlagTrue = (process.argv.includes('--cloud') === true)

  const shouldWrapExports = isInLambda
  const shouldConvExports = (isCloudFlagTrue && isExportingFns)

  console.log('need to conv exports: ', shouldConvExports)
  console.log('need to wrap exports: ', shouldWrapExports)

  // --cloud : conv
  if (shouldConvExports === true) {
    const newmoduleexp = convExports(curr)
    return newmoduleexp
  }
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

main('/home/qng/cloudkernel/recruiter', /^fn_/)

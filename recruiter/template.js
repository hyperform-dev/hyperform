/* eslint-disable */
/**
 * 
 * @param {*} moduleexp 
 * @param {*} [exp] 
 */
module.exports = function change(moduleexp, exp = {}) {
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
      // if we process same export twice for some reason
      // it should be idempotent
      if (userfunc.hyperform_wrapped === true) {
        continue
      }
      const wrappedfunc = async function handler(event, context) {
        const res = await userfunc(event, context) // todo add context.fail
        context.succeed(res)
      }
      wrappedfunc.hyperform_wrapped = true
      newmoduleexports[expkey] = wrappedfunc
    }

    return newmoduleexports
  }

  // for --cloud, swap fn_ exports with cloud call thereof
  function convExports(moduleexports) {
    const newmoduleexports = { ...moduleexports };
    const fn_expkeys = Object.keys(moduleexports).filter((k) => (/fn_/.test(k) === true))

    // for each fn_ export
    for (let i = 0; i < fn_expkeys.length; i += 1) {
      // replace it with envoy version
      const fn_expkey = fn_expkeys[i]
      // if we process same export twice for some reason
      // it should be idempotent
      if (newmoduleexports[fn_expkey].hyperform_converted === true) {
        continue
      }
      console.log('changing ', fn_expkey)
      newmoduleexports[fn_expkey] = (...args) => envoy(fn_expkey, ...args)
      newmoduleexports[fn_expkey].hyperform_converted = true
    }

    return newmoduleexports;
  }

  const curr = { ...exp, ...moduleexp }

  console.log(Object.keys(curr))
  const isExportingFns = Object.keys(curr).some((k) => (/fn_/.test(k) === true))
  console.log("isexportingfns", isExportingFns)
  const isInLambda = !!(process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV)
  const isCloudFlagTrue = (process.argv.includes('--cloud') === true)
  console.log("iscloudflagtrue", isCloudFlagTrue)

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
}


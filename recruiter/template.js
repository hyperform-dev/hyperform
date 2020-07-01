module.exports = (() => {
  function envoy(name, input) {
    console.log(`Would envoy ${name} input ${input}`)
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

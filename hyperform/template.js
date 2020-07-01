/* eslint-disable */
/**
 * 
 * @param {*} moduleexp 
 * @param {*} [exp] 
 */
module.exports = () => {
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
}


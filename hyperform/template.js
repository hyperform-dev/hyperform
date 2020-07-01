/* eslint-disable */
/**
 * 
 * @param {*} moduleexp 
 * @param {*} [exp] 
 */
module.exports = () => {
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
}


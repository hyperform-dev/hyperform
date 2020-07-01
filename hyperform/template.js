/* eslint-disable */
/**
 * @description The module appendix template. Never import this, 
 * only copy-paste from here to transpiler/index.js
 * @param {*} moduleexp 
 * @param {*} [exp] 
 */
module.exports = () => {
  // START PASTE

  /**
  * This is the Hyperform wrapper
  * Plain-text for better readability
  */

  /**
   * @description Helper function that wraps the 'return' 
   * statement depending on platform
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
          let event = {} 
          // TODO support plain inputs
          // try to parse as json, otherwise just pass 
          // 1 => "1", "abc" => "abc", '{"a":1}' => { a: 1}
          if(input.body) {
            event = (input.isBase64Encoded === true)
              ? JSON.parse( Buffer.from(input.body, 'base64').toString('utf-8') )
              : JSON.parse(input.body) // TODO throw invalid input code if could not decode
              // TODO generally a way to throw HTTP status codes
              
          } else {
            console.log("No 'body' field found in input.") // visible in CloudWatch and on Google
          }
          const res = await userfunc(event) // TODO add context.fail?
          context.succeed(res)
        }
      } 
      if(platform === 'google') {
        wrappedfunc = async function handler(req, resp) {
          ${googleBearerCheckCode}
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


  // END PASTE
}


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
    * It provides some usability features
    * Amazon:
    *    - Return error codes of common development mistakes
    * Google:
    *    - Send pre-flight headers
    *    - console.warn on missing headers
    *    - console.error on error
    *
    * Plain-text for better readability
    */
  global.alreadyWrappedNames = [];

  function wrapExs(me, platform) {
    const newmoduleexports = { ...me };
    const expkeys = Object.keys(me);
    for (let i = 0; i < expkeys.length; i += 1) {
      const expkey = expkeys[i];
      const userfunc = newmoduleexports[expkey];
      // it should be idempotent
      // TODO fix code so this doesn't happen
      if (global.alreadyWrappedNames.includes(expkey)) {
        continue;
      }
      global.alreadyWrappedNames.push(expkey);
      let wrappedfunc;
      if (platform === 'amazon') {
        wrappedfunc = async function handler(event, context, callback) {
          /// ////////////////////////////////
          // Invoke user function ///////
          /// ////////////////////////////////

          let res;
          try {
            res = await userfunc(event, context, callback); // TODO add context.fail?
            context.succeed(res);
          } catch (e) {
            if (e.code === 'AccessDeniedException') {
              // return details for debugging
              context.succeed({
                statusCode: 500,
                body: JSON.stringify({
                  code: e.code,
                  notice: 'For easier development, Hyperform always openly returns the error code for: [AccessDeniedException].',
                }),
              });
            } else {
              throw e; // return non-descriptive 500
            }
          }
        };
      }
      if (platform === 'google') {
        wrappedfunc = async function handler(req, resp, ...rest) {
          // allow to be called from anywhere (also localhost)
          //    resp.header('Content-Type', 'application/json');
          resp.header('Access-Control-Allow-Origin', '*');
          resp.header('Access-Control-Allow-Headers', '*');
          resp.header('Access-Control-Allow-Methods', '*');
          resp.header('Access-Control-Max-Age', 30);

          // respond to CORS preflight requests
          if (req.method === 'OPTIONS') {
            resp.status(204).send('');
          } else {
            // Warn at common Express mistake
            // (No content-type header will lead to body-parser not parsing the body)
            // User will POST but function will receive no input
            if (
              req.method.toLowerCase() === 'post'
               && req.headers['content-type'] !== 'application/json'
            ) {
              console.warn('Dont forget to specify the Content-Type header in case you are POSTing JSON.');
            }

            // Invoke user function
            // (user must .json or .send himself)
            try {
              await userfunc(req, resp, ...rest);
            } catch (e) {
              console.error(e);
              resp.status(500).send(''); // TODO generate URL to logs (similar to GH)
            }
          }
        };
      }
      newmoduleexports[expkey] = wrappedfunc;
    }
    return newmoduleexports;
  }
  const curr = { ...exports, ...module.exports };
  const isInAmazon = !!(process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV);
  const isInGoogle = (/google/.test(process.env._) === true);
  if (isInAmazon === true) {
    return wrapExs(curr, 'amazon');
  }
  if (isInGoogle === true) {
    return wrapExs(curr, 'google');
  }
  return curr; // Export unchanged (local, fallback)

  // END PASTE
};

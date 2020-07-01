/**
 * @description Transpiles Javascript code so that Common-JS-exported functions it can run on any 
 * Cloud provider. Does so by appending wrapper code. 
 * If "expectedToken" is specified, it hardbakes an equality check that on Google, 
 * will exit immediately if the HTTP request's Bearer is different.
 * @param {string} bundleCode Bundled Javascript code. 
 * Output of the 'bundle' function in bundle/index.js
 * @param {string?} expectedToken
 * @returns {string}
 * @throws If expectedToken is specified,
 * but does not fit security requirements
 */

const { ensureBearerTokenSecure } = require('../authorizer-gen/utils')

// // avoid accidentally empty bearer et cetera
// if (!expectedBearer || !expectedBearer.trim()) {
//   throw new Error('deployAuthorizerLambda: expectedBearer is required')
// }
// if (expectedBearer.trim().length < 10) {
//   throw new Error(`deployAuthorizerLambda: expectedBearer needs to have 10 or more digits for security: ${expectedBearer}`)
// }

/**
 * 
 * @param {string} bundleCode 
 * @param {{
 * needAuth: boolean, 
 * expectedBearer?: string
 * }} options 
 */
function transpile(bundleCode, options) {
  if (options.needAuth === true && !options.expectedBearer) {
    throw new Error(`expectedBearer must be defined when needAuth is true but is ${options.expectedBearer}`) // TODO HF programmer mistake
  }

  let googleBearerCheckCode = ''
  if (options.needAuth === true) {
    // done at a few places but better safe than sorry
    ensureBearerTokenSecure(options.expectedBearer)
    googleBearerCheckCode = `
    if (!req.headers.authorization || req.headers.authorization !== 'Bearer ${options.expectedBearer}') {
      // unauthorized, exit
      return resp.sendStatus(403);
    }
    `
  }

  // note how expectedToken is hardcoded into the appendix
  const appendix = `

;module.exports = (() => {

  /**
    * This is the Hyperform wrapper
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
        wrappedfunc = async function handler(input, context) {
          console.log('from API gateway received inp: ', JSON.stringify(input));
          let event = {};
          // check for GET query string
          if (input.queryStringParameters != null) {
            event = input.queryStringParameters;
          }
          // check for POST body
          else if (input.body != null) {
            event = (input.isBase64Encoded === true)
              ? Buffer.from(input.body, 'base64').toString('utf-8')
              : input.body;
            // try to parse as JSON first
            try {
              event = JSON.parse(event);
            } catch (e) {
              // try to parse as query string second
              event = Object.fromEntries(new URLSearchParams(event));
            }
          } else {
            console.log("Warn: No query string, or 'body' field found in input."); // visible in CloudWatch and on Google
          }
          const res = await userfunc(event); // TODO add context.fail?
          context.succeed(res);
        };
      }
      if (platform === 'google') {
        wrappedfunc = async function handler(req, resp) {
          ${googleBearerCheckCode}
          //            GET          POST
          const input = req.query || JSON.parse(JSON.stringify(req.body));
          const output = await userfunc(input);
          resp.json(output);
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


})();
`

  const transpiledCode = bundleCode + appendix

  return transpiledCode
}

module.exports = {
  transpile,
}

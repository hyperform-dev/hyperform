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
  function wrapExs(me, platform) {
    const newmoduleexports = { ...me };
    const expkeys = Object.keys(me);
    for (let i = 0; i < expkeys.length; i += 1) {
      const expkey = expkeys[i];
      const userfunc = newmoduleexports[expkey];
      // it should be idempotent
      if (userfunc.hyperform_wrapped === true) {
        continue;
      }
      let wrappedfunc;
      if (platform === 'amazon') {
        wrappedfunc = async function handler(input, context) {
          let event = {};
          if (input.body) {
            event = (input.isBase64Encoded === true)
              ? JSON.parse(Buffer.from(input.body, 'base64').toString('utf-8'))
              : JSON.parse(input.body);
          } else {
            console.log("Warn: No 'body' field found in input."); // visible in CloudWatch and on Google
          }
          const res = await userfunc(event); // TODO add context.fail?
          context.succeed(res);
        };
      }
      if (platform === 'google') {
        wrappedfunc = async function handler(req, resp) {
          ${googleBearerCheckCode}
          const input = JSON.parse(JSON.stringify(req.body));
          const output = await userfunc(input);
          resp.json(output);
        };
      }
      wrappedfunc.hyperform_wrapped = true;
      newmoduleexports[expkey] = wrappedfunc;
    }
    return newmoduleexports;
  }
  const curr = { ...exports, ...module.exports };
  const isInAmazon = !!(process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV);
  const isInGoogle = (/google/.test(process.env._) === true);
  if (isInAmazon === true) {
    const newmpexp = wrapExs(curr, 'amazon');
    return newmpexp;
  }
  if (isInGoogle === true) {
    const newmexp = wrapExs(curr, 'google');
    return newmexp;
  }
  return curr; // Export unchanged (local, fallback)

  // END PASTE
};

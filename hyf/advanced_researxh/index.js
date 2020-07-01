/* eslint-disable */

function fn_() {
  console.log('fn_')
}

function a() {
  console.log('a')
  b()
}

function b() {
  console.log('b')
  fn_()
}

module.exports = {
  a,
  b,
  fn_,
};

;;module.exports = (() => {
  function _getCallerFile() {
    try {
      const err = new Error();
      let callerfile;
      let currentfile;

      Error.prepareStackTrace = function (err, stack) { return stack; };

      currentfile = err.stack.shift().getFileName();

      while (err.stack.length) {
        callerfile = err.stack.shift().getFileName();

        if (currentfile !== callerfile) return callerfile;
      }
    } catch (err) { }
    return null;
  }

  function convExports(moduleexports) {
    const newmoduleexports = { ...moduleexports };
    const fn_expkeys = Object.keys(moduleexports).filter((k) => (/fn_/.test(k) === true))

    // for each fn_ export
    for (let i = 0; i < fn_expkeys.length; i += 1) {
      // replace it with envoy version
      const fn_expkey = fn_expkeys[i]
      console.log(`changing ${fn_expkey}`)
      newmoduleexports[fn_expkey] = (...args) => console.log(`${fn_expkey} intercepted, called with ${args}`)
    }

    return newmoduleexports;
  }

  const curr = { ...module.exports }

  const isExportingFns = Object.keys(curr).some((k) => (/fn_/.test(k) === true))
  const isInLambda = !!(process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV)
  // Falls back on true
  const isInvokedDirectlyByProvider = (() => {  
    const cloudcallers = [
      '/var/runtime/Runtime.js', // amazon lambda
    ]

    const caller = _getCallerFile()
    if (caller == null) {
      return true 
    }
    if (cloudcallers.includes(caller) === true) {
      return true
    }
    return false
  })();
  const isCloudFlagTrue = (process.argv.includes('--cloud') === true)
 
  const shouldChangeExports = (() => {
    // (1) Not exporting and fn_ s, hence nothing to change
    if (isExportingFns === false) return false;
  
    // local case
    if (isInLambda === false) {
      return isCloudFlagTrue
    }

    // in lambda case 
    // is invoked by provider => false, we don't want to change exports
    // is not invoked by provider => true
    return !isInvokedDirectlyByProvider
  })();

  console.log('need to change exports: ', shouldChangeExports)
  
  if (shouldChangeExports === true) {
    // Override fn_ with their cloud version
    const newexports = convExports(curr)
    return newexports
  }
  
  return curr; // Export unchanged
})();

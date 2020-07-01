function change(moduleexports) {
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

  const { amazonEnvoy } = require('./envoy')

  function convExports(__moduleexports) {
    const newmoduleexports = { ...__moduleexports };
    const fn_expkeys = Object.keys(__moduleexports).filter((k) => (/fn_/.test(k) === true))

    // for each fn_ export
    for (let i = 0; i < fn_expkeys.length; i += 1) {
      // replace it with envoy version
      const fn_expkey = fn_expkeys[i]
      const fn_expval = __moduleexports[fn_expkey]
      // ensure it's a function
      if (!fn_expval.constructor || !fn_expval.constructor.name) {
        throw new Error(`The export "${fn_expkey}" must be a function`)
      }
      // ensure it's declared async
      if (fn_expval.constructor.name !== 'AsyncFunction') {
        throw new Error(`The export "${fn_expkey}" should be declared async so its behavior is the same in the cloud. This usually indicates a programming error.`)
      }

      console.log(`changing ${fn_expkey}`)
      newmoduleexports[fn_expkey] = (...args) => amazonEnvoy(fn_expkey, ...args)
    }

    console.log('a')
    return newmoduleexports;
  }

  const curr = { ...moduleexports }

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
    // is invoked by provider => false, provider should see local function
    // is not invoked by provider => true
    return !isInvokedDirectlyByProvider
  })();

  console.log('need to change exports: ', shouldChangeExports)
  
  if (shouldChangeExports === true) {
    // Override fn_ with their cloud version
    const newexports = convExports(curr)
    console.log('b')
    return newexports
  }
  console.log('c')
  return curr; // Export unchanged
}

module.exports = change;

const arg = require('arg')

// const invert = (p) => new Promise((res, rej) => p.then(rej, res));

// /** This will return the value of the first fulfilled promise, 
//  * ... or if all reject, an array of rejection reasons.
//  * 
//  * @param {[Promise<*>]} ps 
//  */
// const firstOf = (ps) => invert(Promise.all(ps.map(invert)));

/**
 * Checks some things about what the fn returned. Throws if not successful.
 * @param {Object} envoyOutput 
 * @returns {void}
 */
function validateOutput(response, name) {
  // Enforce it's either null or undefined
  if (response == null) {
    return
  }

  // ... or an object or array
  if (typeof response === 'object') {
    return
  }

  // Throw on strings, and numbers
  // sorry amazon, google & ibm do not support it
  throw new Error(`Function ${name} must return null, or object, or array, but returned type: ${typeof response}`)
}

/**
 * Extracts all names ("run" fields) from workflow
 * @param {*} parsedFlowJson 
 * @returns {Array}
 */
function getAllFunctionNames(parsedFlowJson) {
  const strJson = JSON.stringify(parsedFlowJson)
  const globalmatches = strJson.match(/"run":"[^"]*"/g)
  const fnames = globalmatches
    .map((m) => m.replace(/"/g, ''))
    .map((m) => m.replace('run:', ''))

  return fnames
}

const args = arg({
  '--in': String,
  '--verbose': Boolean,
  '-v': '--verbose',
})

const { log } = console
let logdev 

// set right logging level
if (args['--verbose'] === true) {
  logdev = console.log
} else {
  // don't show dev-level logging
  logdev = () => { }
  // don't show timings
  console.time = () => { }
  console.timeEnd = () => { }
}

module.exports = {
  validateOutput,
  getAllFunctionNames,
  log, 
  logdev,
}

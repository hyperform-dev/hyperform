const { EOL } = require('os')

const invert = (p) => new Promise((res, rej) => p.then(rej, res));

/** This will return the value of the first fulfilled promise, 
 * ... or if all reject, an array of rejection reasons.
 * 
 * @param {[Promise<*>]} ps 
 */
const firstOf = (ps) => invert(Promise.all(ps.map(invert)));

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

module.exports = {
  firstOf,
  validateOutput,
}

const { EOL } = require('os')

const invert = (p) => new Promise((res, rej) => p.then(rej, res));

/** This will return the value of the first fulfilled promise, 
 * ... or if all reject, an array of rejection reasons.
 * 
 * @param {[Promise<*>]} ps 
 */
const firstOf = (ps) => invert(Promise.all(ps.map(invert)));

/**
 * Checks some things about envoyOutput. Throws if not successful.
 * @param {Object} envoyOutput 
 * @returns {void}
 */
function validateOutput(response, name) {
  if (response == null) {
    return
  }
  // throw if envoyOutput is JSON-parseable AGAIN
  // indicates a user programming error; that he manually stringified it in the lambda
  let parsedtwice 
  try {
    parsedtwice = JSON.parse(response)
  } catch (e) { }

  if (typeof parsedtwice === 'object') {
    throw new Error(`${EOL} Error: Output of ${name} was parseable twice. This indicates a programming error. Make sure you don't manually JSON.stringify() or json.dumps in your function ${name}. ${EOL}`)
  }
  // TODO write tests

  // allow numbers, strings, objects, arrays
  // TODO check if that conflicts in some langs / providers)
}

module.exports = {
  firstOf,
  validateOutput,
}

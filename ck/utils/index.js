const invert = (p) => new Promise((res, rej) => p.then(rej, res));

/** This will return the value of the first fulfilled promise, or if all reject, an array of rejection reasons.
 * 
 * @param {[Promise<*>]} ps 
 */
const firstOf = (ps) => invert(Promise.all(ps.map(invert)));

module.exports = {
  firstOf,
}

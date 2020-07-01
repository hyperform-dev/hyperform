const { _bundle } = require('../utils')
/**
 * @description Bundles a given .js files for Google with its dependencies using webpack.
 * @param {string} inpath Path to entry .js file
 * @returns {Promise<string>} The bundled code
 */
async function bundleGoogle(inpath) {
  let externals // TODO check if @google is included on Google?
  const res = await _bundle(inpath, externals)
  return res
}

module.exports = {
  bundleGoogle,
}

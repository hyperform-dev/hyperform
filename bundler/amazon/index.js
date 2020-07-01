const { _bundle } = require('../utils')
/**
 * @description Bundles a given .js files for Amazon with its dependencies using webpack.
 * @param {string} inpath Path to entry .js file
 * @returns {Promise<string>} The bundled code
 */
async function bundleAmazon(inpath) {
  const externals = {
    'aws-sdk': 'aws-sdk',
  }
  const res = await _bundle(inpath, externals)
  return res
}

module.exports = {
  bundleAmazon,
}

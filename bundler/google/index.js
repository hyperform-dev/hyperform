const fs = require('fs')
const { _bundle } = require('../utils')
/**
 * @description Bundles a given .js files for Google using Webpack. IMPORTANT: excludes any npm packages. 
 * @param {string} inpath Path to entry .js file
 * @returns {Promise<string>} The bundled code
 */
async function bundleGoogle(inpath) {
  // Exclude any npm packages (if present)
  // From https://github.com/webpack/webpack/issues/603#issuecomment-180509359
  const externals = fs.existsSync('node_modules') && fs.readdirSync('node_modules')
  
  // TODO check if @google is included on Google?
  const res = await _bundle(inpath, externals)
  return res
}

module.exports = {
  bundleGoogle,
}

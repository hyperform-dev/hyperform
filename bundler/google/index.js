const { _bundle } = require('../utils')
/**
 * @description Bundles a given .js files for Google using Webpack. IMPORTANT: excludes any npm packages. 
 * @param {string} inpath Path to entry .js file
 * @returns {Promise<string>} The bundled code
 */
async function bundleGoogle(inpath) {
  // Exclude any npm packages
  // From https://github.com/webpack/webpack/issues/603#issuecomment-320191141
  const externals = [
    function (context, request, callback) {
      // get absolute path to required file
      const resourcePath = this.resolveSync(context, request);

      // don't bundle node_modules
      if (/node_modules/.test(resourcePath)) {
        return callback(null, `commonjs ${request}`);
      }
      callback();
    },
  ] 
  
  // TODO check if @google is included on Google?
  const res = await _bundle(inpath, externals)
  return res
}

module.exports = {
  bundleGoogle,
}

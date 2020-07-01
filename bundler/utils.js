const webpack = require('webpack')
const path = require('path')
const fsp = require('fs').promises
const os = require('os')
const { logdev } = require('../printers/index')

/**
 * @description Bundles a given .js files with its dependencies using webpack. 
 * Does not include dependencies that are given in "externals".
 * @param {string} inpath Path to entry .js file
 * @param {*} externals Webpack 'externals' field of package names we don't need to bundle. 
 * For example { 'aws-sdk': 'aws-sdk' } to skip 'aws-sdk'
 * @returns {Promise<string>} The bundled code
 */
async function _bundle(inpath, externals) {
  // create out dir (silly webpack)
  const outdir = await fsp.mkdtemp(path.join(os.tmpdir(), 'bundle-'))
  const outpath = path.join(outdir, 'bundle.js')

  return new Promise((resolve, reject) => {
    webpack(
      {
        mode: 'production',
        entry: inpath,
        target: 'node',
        output: {
          path: outdir,
          filename: 'bundle.js',
          // so amazon sees it
          libraryTarget: 'commonjs',
        },
        // aws-sdk is already provided in lambda
        externals: externals,
      },
      (err, stats) => {
        if (err || stats.hasErrors()) {
          logdev(`Bundling ${inpath} failed: `)
          try {
            logdev(stats.compilation.errors)
          } catch (e) {
            logdev(stats)
          }
          reject(err, stats)
        } else {
          // return the bundle code
          fsp.readFile(outpath, { encoding: 'utf8' })
            .then((code) => resolve(code))
          // TODO clean up file 
          // TODO do in-memory 
        }
      },
    )
  })
}

module.exports = {
  _bundle,
}

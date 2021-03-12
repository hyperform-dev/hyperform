const webpack = require('webpack')
const path = require('path')
const fsp = require('fs').promises
const os = require('os')
const { log } = require('../printers/index')

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
  
  console.log(`bundling to ${outpath}`)
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
          // Make webpack perform identical as node
          // See https://github.com/node-fetch/node-fetch/issues/450#issuecomment-494475397
          // extensions: ['.js'],
          // mainFields: ['main'],

          // Fixes "global"
          // See https://stackoverflow.com/a/64639975
          //     globalObject: 'this',
        },
        // aws-sdk is already provided in lambda
        externals: externals,
      },
      (err, stats) => {
        if (err || stats.hasErrors() || (stats.compilation.errors.length > 0)) {
          // always show bundling error it's useful
          log(`Bundling ${inpath} did not work: `)
          log(stats.compilation.errors)
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

const webpack = require('webpack')
const path = require('path')
const fsp = require('fs').promises
const os = require('os')

/**
 * Bundles a given .js files with its dependencies using webpack
 * @param {string} inpath Path of entry .js file
 * @returns {string} The bundled code
 */
async function bundle(inpath) {
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
        externals: {
          'aws-sdk': 'aws-sdk', // TODO does google include gcloud sdk? // TODO wont be true if aws code uses google sdk etc
        },
      },
      (err, stats) => {
        if (err || stats.hasErrors()) {
          console.log(`ERROR: Bundling ${inpath} failed`)
          try {
            console.log(stats.compilation.errors)
          } catch (e) {
            console.log(stats)
          }
          reject(err, stats)
        } else {
          // return the bundle code
          fsp.readFile(outpath, { encoding: 'utf8' })
            .then((code) => resolve(code))
        }
      },
    )
  })
}

module.exports = {
  bundle,
}

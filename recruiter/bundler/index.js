const webpack = require('webpack')
const path = require('path')
const compressing = require('compressing')

async function bundle(filepath, outpath) {
  console.log(filepath, outpath)
  return new Promise((resolve, reject) => {
    webpack(
      {
        mode: 'production',
        entry: filepath,
        //  target: 'node',
        output: {
          path: path.dirname(outpath),
          filename: path.basename(outpath),
          libraryTarget: 'commonjs',
        },
      },
      (err, stats) => {
        if (err || stats.hasErrors()) {
          console.error(`ERROR: Bundling ${filepath} failed`)
          try {
            console.log(stats.compilation.errors)
          } catch (e) {
            console.log(stats)
          }
          reject(err, stats)
        } else {
          resolve()
        }
      },
    )
  })
}

/**
     * Creates zip of a certain bundle, right next to it.
     * @returns {Promise<string>} path to the zip
     * @param {{names: string[], bundlepath: string}} r 
     */
async function createZip(r) {
  const outpath = path.join(
    path.dirname(r.bundlepath),
    // this must be the prefix of handlers when deploying !
    'deploypackage.zip',
  )
  const inpath = r.bundlepath 
  await compressing.zip.compressFile(inpath, outpath)
  return outpath
}

module.exports = {
  bundle,
  createZip,
}

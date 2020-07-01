const webpack = require('webpack')
const path = require('path')
const fsp = require('fs').promises
const os = require('os')
const compressing = require('compressing')

// blacklist what npm packages (per provider) not to bundle 
const ignorePluginOptions = {
  // aws-sdk is provided to lambdas, no need to include it
  amazon: {
    resourceRegExp: /^aws-sdk/,
  },
}

const bundlers = {
  /** @param 
   * @returns {Promise<string>} resolves to the bundled code string
   * @param {*} inpath 
   */
  js: async function (inpath, provider) {
    // create out dir
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
          // so we don't upload unnecessary SDKs
          plugins: [
            new webpack.IgnorePlugin(
              ignorePluginOptions[provider],
            ),
          ],
        },
        (err, stats) => {
          if (err || stats.hasErrors()) {
            console.error(`ERROR: Bundling ${inpath} failed`)
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
  },
}

/**
 * Bundles given file and returns its code
 * @param {string} inpath 
 * @param {string} lang js|
 */

async function bundle(inpath, lang, provider) {
  if (lang !== 'js') {
    throw new Error(`UNIMEPLEMED: bundle for lang ${lang}`)
  }
  if (provider !== 'amazon') {
    throw new Error(`UNIMEPLEMED: bundle for provider ${provider} (needed to exclude SDK's from uploading)`)
  }
  return bundlers[lang](inpath, provider)
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

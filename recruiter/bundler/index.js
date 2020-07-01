const webpack = require('webpack')
const path = require('path')
const fsp = require('fs').promises
const os = require('os')

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
  console.time(`bundle-${inpath}`)
  const res = await bundlers[lang](inpath, provider)
  console.timeEnd(`bundle-${inpath}`)
  return res
}

module.exports = {
  bundle,
}

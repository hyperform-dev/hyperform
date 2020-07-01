const webpack = require('webpack')
const path = require('path')

async function bundle(filepath, outpath) {
  return new Promise((resolve, reject) => {
    webpack(
      {
        mode: 'development',
        entry: filepath,
        target: 'node',
        output: {
          path: path.dirname(outpath),
          filename: path.basename(outpath),
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

module.exports = {
  bundle,
}

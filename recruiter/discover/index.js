const findit = require('findit')
const path = require('path')

const BLACKLIST = [
  '.git',
  'node_modules',
]

async function getJsFilePaths(dir) {
  return new Promise((resolve, reject) => {
    const fnames = []
    const finder = findit(dir)

    finder.on('directory', (_dir, stat, stop) => {
      const base = path.basename(_dir);
      if (BLACKLIST.includes(base)) {
        stop()
      }
    });

    finder.on('file', (file, stat) => {
      // only return .js files
      if (/.js$/.test(file) === true) {
        fnames.push(file)
      }
    });

    finder.on('end', () => {
      resolve(fnames)
    })

    finder.on('error', (err) => {
      reject(err)
    })
  })
}

function getNamedExports(filepath) {
  // TODO hides that code is run but actually runs it lol, find a way to get exports without running code
  const imp = (() => {
    console.log = () => {}
    console.error = () => {}
    console.warn = () => {}
    return require(filepath)
  })()
  const namedexpkeys = Object.keys(imp)
  return namedexpkeys
}

module.exports = {
  getJsFilePaths,
  getNamedExports,
}

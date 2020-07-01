const findit = require('findit')
const path = require('path')

const BLACKLIST = [
  '.git',
  'node_modules',
]

function getJsFilepaths(dir) {
  if (path.isAbsolute(dir) === false) {
    throw new Error('getJsFilepaths: given dir must be absolute')
  }

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
  try {
    const imp = (() => 
      // console.log = () => {}
      // console.error = () => {}
      // console.warn = () => {}
      require(filepath)
    )()
    const namedexpkeys = Object.keys(imp)
    return namedexpkeys
  } catch (e) {
    console.log(`Could not determine named exports of ${filepath}. Ignoring it. ` + e)
    // if js file isn't parseable, top level code throws, etc
    // say that it does not have named exports
    return []
  }
}

module.exports = {
  getJsFilepaths,
  getNamedExports,
}

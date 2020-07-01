const findit = require('findit')
const path = require('path')

const BLACKLIST = [
  '.git',
  'node_modules',
]

const filepathgetters = {
  js: function (dir) {
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
        console.log(file)
        // only return .js files
        if (/.js$/.test(file) === true) {
          console.log(`will use ${file}`)
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
  },
}

function getFilePaths(root, lang) {
  if (lang !== 'js') {
    throw new Error(`UNIMPLEMENTED: getFilePaths for ${lang}`)
  }
  return filepathgetters[lang](root)
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
    console.log(e)
    throw e
  }
}

module.exports = {
  getFilePaths,
  getNamedExports,
}

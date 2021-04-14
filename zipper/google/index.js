const _zipdir = require('zip-dir')
const fsp = require('fs').promises
const path = require('path')
const os = require('os')
/**
 * 
 * @param {string} dir 
 * @param {string[]} except names of directories or files that will not be included 
 * (usually ["node_modules", ".git", ".github"]) Uses substring check.
 * @returns {string} outpath of the zip
 * 
 */
async function zipDir(dir, except) {
  // create tmp dir
  const outdir = await fsp.mkdtemp(path.join(os.tmpdir(), 'zipDir-zipped-'))
  const outpath = path.join(outdir, 'deploypackage.zip')

  // The second argument of https://www.npmjs.com/package/zip-dir
  // Function that is called on every file / dir to determine if it'll be included in the zip
  const filterFunc = (p, stat) => {
    for (let i = 0; i < except.length; i += 1) {
      if (p.includes(except[i])) {
        console.log(`Excluding ${p}`)
        return false 
      }
    }
    return true 
  }

  const res = await new Promise((resolve, rej) => {
    _zipdir(dir, {
      saveTo: outpath,
      filter: filterFunc,

    },
    (err, r) => {
      if (err) {
        rej(err)
      } else {
        resolve(outpath) // resolve with the outpath
      } 
    })
  })

  return res 
}

module.exports = {
  zipDir,
}

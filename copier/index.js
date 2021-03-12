const { ncp } = require('ncp')
const path = require('path')
const os = require('os')
const fsp = require('fs').promises
/**
 * Creates a copy of a directory in /tmp.
 * @param {string} dir
 * * @param {string[]} except names of directories or files that will not be included 
 * (usually ["node_modules", ".git", ".github"]) Uses substring check.
 * @returns {string} outpath
 */
async function createCopy(dir, except) {
  const outdir = await fsp.mkdtemp(path.join(os.tmpdir(), 'copy-'))
 
  // See https://www.npmjs.com/package/ncp

  // concurrency limit
  ncp.limit = 16 

  // Function that is called on every file / dir to determine if it'll be included in the zip
  const filterFunc = (p) => {
    for (let i = 0; i < except.length; i += 1) {
      if (p.includes(except[i])) {
        console.log(`excluding ${p}`)
        return false 
      }
    }
    return true
  }

  const res = await new Promise((resolve, rej) => {
    ncp(
      dir,
      outdir,
      {
        filter: filterFunc,
      },       
      (err) => {
        if (err) {
          rej(err)
        } else {
          resolve(outdir)
        }
      },
    );
  })

  return res 
}

module.exports = {
  createCopy,
}

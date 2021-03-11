const findit = require('findit')
const path = require('path')
const { EOL } = require('os')
const fs = require('fs')
const { log } = require('../printers/index')

const BLACKLIST = [
  '.git',
  'node_modules',
]

/**
 * @description Searches "absdir" and its subdirectories for .js files
 * @param {string} absdir An absolute path to a directory
 * @returns {Promise<string[]>} Array of absolute file paths to .js files
 */
// TODO do not follow symlinks (or do?)
function getJsFilepaths(absdir) {
  return new Promise((resolve, reject) => {
    const fnames = []
    const finder = findit(absdir)
  
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

/**
 * @description Runs a .js file to get its named export keys 
 * @param {string} filepath Path to .js file
 * @returns {string[]} Array of named export keys
 */
function getNamedExportKeys(filepath) {
  // hides that code is run but actually runs it lol
  // TODOfind a way to get exports without running code
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
    // if js file isn't parseable, top level code throws, etc
    // ignore it
    log(`Could not determine named exports of ${filepath}, ignoring it. ${EOL} Error: ${e}`)
    return []
  }
}

/**
 * Checks if file contents match a regex
 * @param {*} fpath 
 * @param {*} regex 
 * @returns {boolean}
 */
function isFileContains(fpath, regex) {
  const contents = fs.readFileSync(fpath, { encoding: 'utf-8' })
  const res = regex.test(contents) 
  return res 
}

/**
 * @description Scouts "dir" and its subdirectories for .js files named 
 * exports that match "fnregex"
 * @param {string} dir 
 * @param {Regex} fnregex 
 * @returns {[ { p: string, exps: string[] } ]} Array of "p" (path to js file)
 *  and its named exports that match fnregex ("exps")
 */
async function getInfos(dir, fnregex) {
  let jsFilePaths = await getJsFilepaths(dir)
  // First check - filter out files that don't even contain a string matching fnregex (let alone export it)
  jsFilePaths = jsFilePaths
    .filter((p) => isFileContains(p, fnregex))
  // Second check - determine exports by running file, and keep those that export sth matching fnregex
  const infos = jsFilePaths
    .map((p) => ({
      p: p,
      exps: getNamedExportKeys(p),
    }))
    // skip files that don't have named exports
    .filter(({ exps }) => exps != null && exps.length > 0)
    // skip files that don't have named exports that fit fnregex
    .filter(({ exps }) => exps.some((exp) => fnregex.test(exp) === true))
    // filter out exports that don't fit fnregex
    .map((el) => ({ ...el, exps: el.exps.filter((exp) => fnregex.test(exp) === true) }))

  return infos
}

module.exports = {
  getInfos,
}

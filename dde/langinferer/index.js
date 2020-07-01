const fsp = require('fs').promises
const path = require('path');

const WHITELIST = [
  'js',
  'java',
]

// TODO wont work well with java due to nested dir structure

/**
 * Guesses the programming language a Lambda is written in.
 * @param {*} dir path to the lambdafolder
 * @returns {string} 'js' | 'java' or throws
 */
async function inferLanguageFromDir(dir) {
  // get list of filenames (top level)
  let filenames = await fsp.readdir(dir, { withFileTypes: true })
  filenames = filenames
    .filter((p) => p.isFile() === true)
    .map((p) => p.name)

  // only keep their extensions ('file.txt' => 'txt')
  let fileexts = filenames
    .map((fname) => path.extname(fname)) // extract file extension 
    .map((ext) => ext.replace(/\./g, '')) // remove dots
    .filter((ext) => ext.length)
    .map((ext) => ext.toLowerCase())

  // Only keep proglang-related extensions (conveniently which we support deployment for)
  fileexts = fileexts 
    .filter((ext) => WHITELIST.includes(ext))

  // count ocurrences of each extension
  // eg { md: 1, js: 5, json: 2 }
  const occurences = fileexts.reduce((acc, curr) => {
    const prevOccur = acc[curr] || 0
    return {
      ...acc,
      [curr]: prevOccur + 1,
    }
  }, {})

  // return the one with most occurences
  for (const ext in occurences) {
    if (occurences[ext] === Math.max(...Object.values(occurences))) {
      return ext 
    }
  }

  throw new Error(`Could not infer language for directory ${dir}`)
}

module.exports = {
  inferLanguageFromDir,
}

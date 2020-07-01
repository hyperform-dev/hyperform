const fsp = require('fs').promises
const path = require('path');
const dree = require('dree')

const DREEWHITELIST = [
  'js',
  'java',
  'py',
]

const WHITELISTMATCH = /js|java|py/

const DREEBLACKLIST = [
  /\.github/,
  /\.git/,
  /coverage/,
]
// TODO wont work well with java due to nested dir structure

/**
 * Guesses the programming language a Lambda is written in.
 * @param {*} dir path to the lambdafolder
 * @returns {string} 'js' | 'java' or throws
 */
async function inferLanguageFromDir(dir) {
  // do a tree with depth 5 of the lambda directory
  const tree = await dree.parseAsync(dir, {
    depth: 5,
    extensions: DREEWHITELIST,
    exclude: DREEBLACKLIST,
    excludeEmptyDirectories: true,
    showHidden: false,
    symbolicLinks: false,
  })
  // get array of found prog-language related file extensions (js, java)
  const exts = tree
    .split('\n')
    .map((l) => l && typeof l === 'string' && l.match(WHITELISTMATCH))
    .filter((l) => l) // filter out empty strings, nulls, ...

  // count ocurrences of each extension
  // eg { md: 1, js: 5, json: 2 }
  const occurences = exts.reduce((acc, curr) => {
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

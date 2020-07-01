const path = require('path')
const fsp = require('fs').promises
const arg = require('arg')
const { spinnies } = require('../printer/index')

/**
 * @returns { mode: 'init'|'deploy', root: String}
 */
function parseCliArgs() {
  const args = arg({
  })

  // Defaults
  let mode = 'deploy'
  if (args._ && args._.includes('init')) mode = 'init'
  
  // ~~ Force user to invoke dd in his project folder (akin to pip, npm)
  const root = process.cwd()

  return {
    mode: mode,
    // keepUploadable: args['--keep-uploadable'],
    root: root,
  }
}

/**
 * 
 * @returns {string[]} absolute paths to relevant child folders of 'forEachIn' field, ie to lambdas
 * @param {*} task Given a task...
 */
async function getCandidatePaths(task, args) {
  // List all child folders of 'forEachIn' field
  let fnFolderNames
  try {
    fnFolderNames = await fsp.readdir(
      path.join(args.root, task.forEachIn), { withFileTypes: true }, 
    ) 
  } catch (e) {
    spinnies.justPrintFail(`Could not read directory stated in deploy.json: ${path.join(args.root, task.forEachIn)}`)
    throw e
  }
 
  // TODO ignore hidden folders on Unix, Windows
  // only keep folders (directories)
  fnFolderNames = fnFolderNames
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
 
  const fnFolderAbsolutePaths = fnFolderNames
    .map((d) => path.join(args.root, task.forEachIn, d)) 

  return fnFolderAbsolutePaths
}

module.exports = {
  getCandidatePaths,
  parseCliArgs,
}

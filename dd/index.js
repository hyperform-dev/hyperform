const arg = require('arg')
const path = require('path')
const fsp = require('fs').promises
const fs = require('fs')
const { readparsevalidate } = require('./parser')
const { runDo } = require('./doer')
const { runUploadAmazon } = require('./uploader/amazon')
const { spinnies } = require('./printer')
/**
 * @returns { mode: 'init'|'deploy', root: String}
 */
function parseCliArgs() {
  const args = arg({
    '--silent': Boolean,
    '-s': '--silent',
  })

  // Defaults
  let mode = 'deploy'
  if (args._ && args._.includes('init')) mode = 'init'
  
  // ~~ Force user to invoke dd in his project folder (akin to pip, npm)
  const root = process.cwd()

  return {
    mode: mode,
    root: root,
  }
}

/**
 * Given a member from deploy.json, builds folder ("do") and uploads ("upload") it to Amazon
 * @param {object} args Whatever parseCliArgs returned
 * @param {object} task Element from the array in deploy.json
 * @param {'amazon' | 'google' | 'ibm' } provider Currently only amazon (default)
 */
async function processTask(args, task, provider = 'amazon') {
  if (provider !== 'amazon') {
    throw new Error('DEV: only amazon as deployment target supported atm')
  }

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

  // "do" and "upload" in each folder

  return fnFolderAbsolutePaths
    .map((p, idx) => { 
      const uploadablePath = path.join(p, task.upload)
      return (
        // Put all major steps here
        runDo(p, task.do, fnFolderNames[idx])
          .then(() => runUploadAmazon(task, fnFolderNames[idx], uploadablePath, p))
          .catch(() => {
          /* 
          This is the catch if the ASYNCHRONIUS code in runDo or runUpload throws
          Do nothing as we still can do the other tasks.
          The user is notified in runDo or runUpload, depending on the error.
        */
          })
      )
    })
}

/// //////////////////////////////////////////////////

async function main() {
  // Top level error boundary
  try {
    // parse CLI args
    const args = parseCliArgs()
    // parse deploy.json
    const parsedJson = await readparsevalidate({
      presetName: 'deploy.json',
      path: path.join(args.root, 'deploy.json'),
    })
   
    // For each element in deploy.json (a task), "do" and "upload"
    const proms = parsedJson
      .map((task) => processTask(args, task, 'amazon')
        .catch(() => {
          /* This is the catch if the SYNCHRONIOUS code in processTasks throws
          Do nothing as we still can do the other tasks.
          The user is notified in processTasks.
          */
        }))
  
    // wait for all to complete
    await Promise.all(proms)
  } catch (e) {
    process.exit(1)
  }
}

main()

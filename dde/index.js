const arg = require('arg')
const path = require('path')
const fs = require('fs')
const fsp = require('fs').promises
const { readparsevalidate } = require('./parser/index')
const { runDo } = require('./doer/index')
const { runUpload } = require('./uploader/index')
const { getCandidatePaths } = require('./utils/index')
const { inferLanguageFromDir } = require('./langinferer/index')
// TODO support region field for amazon

/**
 * Deletes an uploadable
 * @param {{pathOfUploadable: string}} options 
 */
async function cleanUp(options) {
  try {
    await fsp.unlink(options.pathOfUploadable)
    // Cleaning now done intelligently so user is unlikely to care about uploadable,
    // ...  or that is was deleted
    // console.log(`Cleaned up ${options.pathOfUploadable}`)
  } catch (e) {
    console.log(e)
    throw new Error('Could not clean up (delete uploadable)')
  }
}

// TODO remove provider argument, derive that from task lol
// TODO support IBM, or google (ONE) as provider

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

  // Get paths to lambda folders
  const fnFolderAbsolutePaths = await getCandidatePaths(task, args)
  const fnFolderNames = fnFolderAbsolutePaths.map((p) => path.basename(p))
  const uploadablePaths = fnFolderAbsolutePaths.map((p) => path.join(p, task.upload))
  // array of booleans, for each folder
  const shouldKeepUploadables = uploadablePaths.map((p) => {
    if (args['--keep-uploadable'] === true) return true 
    // check if uploadable is there before "do" step
    // if yes, user might want to keep it. 
    // If no, "do" step is likely to (cheaply) generate it and it can be deleted every time
    const exists = fs.existsSync(p)
    return exists
  })

  // TODO move language field out of provider field lol (at latest when google, ibm join..)

  // dominant language of each lambda, we'll derive handler and runtime from that
  //  (usually all the same since "do" kinda dictates per-lang grouping)
  // 'js' | 'java'
  const languages = await Promise.all(
    fnFolderAbsolutePaths.map((p) => task.config.amazon.language || inferLanguageFromDir(p)),
  )
  
  // "do" and "upload" in each folder
  return fnFolderAbsolutePaths
    .map((p, idx) => { 
      const uploadablePath = uploadablePaths[idx]
      const shouldKeepUploadable = shouldKeepUploadables[idx]
      const language = languages[idx]
      return (
        // Put all major steps here
        runDo({
          path: p, 
          command: task.do, 
          hint: fnFolderNames[idx],
        })
          .then(() => runUpload({
            task: task, 
            name: fnFolderNames[idx], 
            pathOfUploadable: uploadablePath, 
            path: p,
            language: language,
          }))
          .then(() => {
            if (shouldKeepUploadable === false) {
              return cleanUp({
                pathOfUploadable: uploadablePath,
              })
            }
          }) 
          .catch((e) => {
            console.log(e)
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

async function main(parsedArgs) {
  // Top level error boundary of dd
  try {
    // parse deploy.json
    const parsedJson = await readparsevalidate({
      presetName: 'deploy.json',
      path: path.join(parsedArgs.root, 'deploy.json'),
    })
   
    // For each element in deploy.json (a task), "do" and "upload"
    const proms = parsedJson
      .map((task) => processTask(parsedArgs, task, 'amazon')
        .catch((e) => {
          console.log(e)
          /* This is the catch if the SYNCHRONIOUS code in processTasks throws
          Do nothing as we still can do the other tasks.
          The user is notified in processTasks.
          */
        }))

    // wait for all to complete
    await Promise.all(proms)
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}

module.exports = {
  main,
}

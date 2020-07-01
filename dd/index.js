const arg = require('arg')
const path = require('path')
const fsp = require('fs').promises
const fs = require('fs')
const { isValidDeployJson } = require('./validators/index')
const { runDo } = require('./doer')
const { runUploadAmazon } = require('./uploader/amazon')
/**
 * @returns { mode: 'init'|'deploy', root: String}
 */
function parseCliArgs() {
  const args = arg({
    '--version': Boolean,
    '-v': '--version',
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

/// //////////////////////////////////////////////////

async function main() {
  // parse CLI args
  const args = parseCliArgs()

  // check if deploy.json present
  const deployJsonPath = path.join(args.root, 'deploy.json')
  if (fs.existsSync(deployJsonPath) === false) {
    throw new Error('No deploy.json found in this directory')
  }

  // try to parse its contents as JSON
  let parsedJson
  try {
    parsedJson = await fsp.readFile(deployJsonPath, { encoding: 'utf8' })
    parsedJson = JSON.parse(parsedJson)
  } catch (e) {
    throw new Error(`deploy.json is not valid JSON ${e}`)
  }

  // validate the schema
  try {
    await isValidDeployJson(parsedJson)
  } catch (e) {
    throw new Error(`deploy.json schema is invalid: ${e}`)
  }
  
  // for each folder, console,log, spawn do-er, then upload to AWS

  // TODO do not only for first entry lol
  const task = parsedJson[0]
  
  // List all child folders of 'forEachIn' field
  let fnFolderNames = await fsp.readdir(
    path.join(args.root, task.forEachIn), { withFileTypes: true }, 
  ) 

  // TODO ignore hidden folders on Unix, Windows
  // only keep folders (directories)
  fnFolderNames = fnFolderNames
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  const fnFolderAbsolutePaths = fnFolderNames
    .map((d) => path.join(args.root, task.forEachIn, d)) 

  // "do" and "upload" in each folder

  await fnFolderAbsolutePaths
    .map((p, idx) => { 
      const uploadablePath = path.join(p, task.upload)
      return (
        runDo(p, task.do)
          .then(() => runUploadAmazon(task, fnFolderNames[idx], uploadablePath))
      )
    })
}

main()

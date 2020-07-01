const arg = require('arg')
const path = require('path')
const fsp = require('fs').promises
const fs = require('fs')
const { isValidDeployJson } = require('./validators/index')
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
  
  // ~~ Force user to invoke dd in his project directory (akin to pip, npm)
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
}

main()

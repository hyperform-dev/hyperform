const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fsp = require('fs').promises
const { spinnies } = require('../../printer/index')

// TODO intelligently infer runtime from uploadable or handler, if not specified in config

// TODO yeah fix that lol
const RUNTIME = 'nodejs12.x'
const HANDLER = 'index.handler' 

async function isExistsAmazon(functionName) {
  // TODO cancel after 5ish seconds 
  try { // TODO sanitize
    await exec(`aws lambda wait function-exists --function-name ${functionName}`)
    return true
  } catch (e) {
    return false
  }
}

function generateDeployCommand(task, name, pathOfUploadable) {
  let cmd = `aws lambda create-function --function-name ${name} --runtime ${RUNTIME} --role ${task.config.amazon.role} --handler ${HANDLER} --zip-file fileb://${pathOfUploadable}`
  if (task.config.timeout) cmd += ` --timeout ${task.config.timeout} `

  return cmd
}

function generateUpdateCommand(task, name, pathOfUploadable) {
  const cmd = `aws lambda update-function-code --function-name ${name} --zip-file fileb://${pathOfUploadable}`

  return cmd
}

/**
 * Does the "do" and "upload" of a given task
 * 
 * @param {{task: Object, name: string, pathOfUploadable: string, path: string, keepUploadable: boolean}} options 
 */
async function runUploadAmazon(options) {
  spinnies.add(options.path, { text: `Deploying ${options.name}` })
  // check if lambda has been deployed before
  const exists = await isExistsAmazon(options.name)
  // piece together terminal command to deploy
  const uploadCmd = (exists === true) 
    ? generateUpdateCommand(options.task, options.name, options.pathOfUploadable)
    : generateDeployCommand(options.task, options.name, options.pathOfUploadable)

  // deploy/upload
  try {
    // TODO TEMP: DUUMMY DEPLOY, DO NOT ACTUALLY DEPLOY 
    // TODO sanitize
    await exec(uploadCmd)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    spinnies.succeed(options.path, { text: `Deployed ${options.name}` })
  } catch (e) {
    spinnies.fail(options.path, { text: `Deploy Error for ${options.name}: ` })
    throw e
  }
}

// TODO updade deploy.json schema for google
// TODO implement google uploader

module.exports = { 
  runUploadAmazon, 
}

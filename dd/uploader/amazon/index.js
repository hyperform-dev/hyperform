const util = require('util');
const exec = util.promisify(require('child_process').exec);
const lstat = util.promisify(require('fs').lstat);
const { spinnies } = require('../../printer')
const fsp = require('fs').promises

// TODO intelligently infer runtime from uploadable or handler, if not specified in config

const RUNTIME = 'nodejs12.x'
const HANDLER = 'index.handler' 

async function isExistsAmazon(functionName) {
  // TODO cancel after 5ish seconds 
  try {
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
 * @param {object} task An object from the deploy.json array
 * @param {string} name Alphanueric name of the lambda function
 * @param {string} pathOfUploadable Where the zip ... lies
 */
async function runUploadAmazon(task, name, pathOfUploadable, path) {
  spinnies.add(path, { text: `Deploying ${name}` })
  // check if lambda already exists
  const exists = await isExistsAmazon(name)
  // piece together terminal command to deploy
  const uploadCmd = (exists === true) 
    ? generateUpdateCommand(task, name, pathOfUploadable)
    : generateDeployCommand(task, name, pathOfUploadable)

  // deploy/upload
  try {
    // TODO TEMP: DUUMMY DEPLOY, DO NOT ACTUALLY DEPLOY 
    await exec(uploadCmd)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    spinnies.succeed(path, { text: `Deployed ${name}` })
  } catch (e) {
    spinnies.fail(path, { text: `Deploy Error for ${name}: ` })
    throw e
  }

  // clean up: delete the uploadable to force rebuilding on next deploy, 
  // and not get into self-zipping rabbithole

  try {
    // TODO could be dangerous .. 
    // only do if "do" was specified?
    // user may point to irreplacable jar lol
    await fsp.unlink(pathOfUploadable)
    console.log(`Cleaned up ${pathOfUploadable}`)
  } catch (e) {
    throw new Error('Could not clean up (delete uploadable)')
  }
}

// TODO updade deploy.json schema for google
// TODO implement google uploader

module.exports = { 
  runUploadAmazon, 
}

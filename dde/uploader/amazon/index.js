const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fsp = require('fs').promises
const { spinnies } = require('../../printer/index')

// TODO intelligently infer runtime from uploadable or handler, if not specified in config

const DEFAULTRUNTIMES = {
  js: 'nodejs12.x',
  java: 'java11',
  py: 'python3.8',
}
const DEFAULTHANDLERS = {
  js: 'index.handler',
  py: 'lambda_function.lambda_handler',
}

async function isExistsAmazon(functionName) {
  try { // TODO sanitize
    await exec(`aws lambda get-function --function-name ${functionName}`)
    return true
  } catch (e) {
    return false
  }
}

function generateDeployCommand(options) {
  const runtime = options.task.config.amazon.runtime || DEFAULTRUNTIMES[options.language]
  const handler = options.task.config.amazon.handler || DEFAULTHANDLERS[options.language]
  
  let cmd = `aws lambda create-function --function-name ${options.name} --runtime ${runtime} --role ${options.task.config.amazon.role} --handler ${handler} --zip-file fileb://${options.pathOfUploadable}`
  if (options.task.config.timeout) cmd += ` --timeout ${options.task.config.timeout} `

  return cmd
}

function generateUpdateCommand(options) {
  const cmd = `aws lambda update-function-code --function-name ${options.name} --zip-file fileb://${options.pathOfUploadable}`

  return cmd
}

/**
 * Does the "do" and "upload" of a given task
 * 
 * @param {{task: Object, name: string, pathOfUploadable: string, path: string, keepUploadable: boolean}} options 
 */
async function runUploadAmazon(options) {
  spinnies.add(options.path, { text: `Deploying ${options.name} in ${options.language}` })
  // check if lambda has been deployed before
  const exists = await isExistsAmazon(options.name)
  // piece together terminal command to deploy
  const uploadCmd = (exists === true) 
    ? generateUpdateCommand(options)
    : generateDeployCommand(options)

  // deploy/upload
  try {
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

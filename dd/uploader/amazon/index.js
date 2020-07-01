const util = require('util');
const exec = util.promisify(require('child_process').exec);
const lstat = util.promisify(require('fs').lstat);

const fs = require('fs');
const { exist } = require('joi');

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
  let cmd = `aws lambda create-function --function-name ${name} --runtime ${RUNTIME} --role ${task.config.role} --handler ${HANDLER} --zip-file fileb://${pathOfUploadable}`
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
async function runUploadAmazon(task, name, pathOfUploadable) {
  // check if lambda already exists
  const exists = await isExistsAmazon(name)
  // piece together terminal command to deploy
  const uploadCmd = (exists === true) 
    ? generateUpdateCommand(task, name, pathOfUploadable)
    : generateDeployCommand(task, name, pathOfUploadable)

  // deploy/upload
  await exec(uploadCmd)
}

module.exports = { runUploadAmazon }

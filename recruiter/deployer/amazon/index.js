const util = require('util');
const exec = util.promisify(require('child_process').exec);

/**
 * 
 * @param {string} pathToZip 
 * @param {{
 * name: string,
 * runtime: string,
 * timeout: number,
 * handler: string,
 * role: string,
 * region: string
 * }} options 
 */
function createUpdateCommand(pathToZip, options) {
  let cmd = `aws lambda update-function-code --function-name ${options.name} --zip-file fileb://${pathToZip}`
  if (options.region) cmd += ` --region ${options.region}`
  return cmd
}

function createDeployCommand(pathToZip, options) {
  let cmd = `aws lambda create-function --function-name ${options.name} --runtime ${options.runtime} --role ${options.role} --handler ${options.handler} --zip-file fileb://${pathToZip}`

  if (options.timeout) cmd += ` --timeout ${options.timeout} `
  if (options.region) cmd += ` --region ${options.region}`
  return cmd
}

async function isExistsAmazon(options) {
  let cmd = `aws lambda get-function --function-name ${options.name}`
  if (options.region) cmd += ` --region ${options.region}`

  try { // TODO sanitize
    await exec(cmd)
    return true
  } catch (e) {
    return false
  }
}

async function deployAmazon(pathToZip, name, handler) {
  const options = {
    name: name,
    runtime: 'nodejs12.x',
    timeout: 60,
    handler: handler || 'index.handler',
    role: 'arn:aws:iam::735406098573:role/lambdaexecute',
    region: 'us-east-2',
  }

  // spinnies.add(options.path, { text: `Deploying ${options.name} in ${options.language}` })
  // check if lambda has been deployed before
  const exists = await isExistsAmazon(options)
  // piece together terminal command to deploy
  const uploadCmd = exists === true 
    ? createUpdateCommand(pathToZip, options)
    : createDeployCommand(pathToZip, options)

  // deploy/upload
  try {
    console.time(`deploy-${name}`)
    // TODO sanitize
    await exec(uploadCmd)
  } catch (e) {
    console.log(`Errored amazon deploy: ${e}`)
    // spinnies.fail(options.path, { text: `Deploy Error for ${options.name}: ` })
    throw e
  }
  console.timeEnd(`deploy-${name}`)
}

module.exports = {
  deployAmazon,
}

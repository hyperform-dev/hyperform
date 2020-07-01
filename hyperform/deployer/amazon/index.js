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

function extractArn(stdout) {
  // amazon CLI returns JSON, very nice 
  const parsed = JSON.parse(stdout) // TODO fallback on per-line regex
  const arn = parsed.FunctionArn  
  return arn
}

/**
 * 
 * @param {*} pathToZip 
 * @param {{
 * name: string, 
 * role: string, 
 * region: string
 * }} options 
 * @returns {string} The Lambda ARN

 */
async function deployAmazon(pathToZip, options) {
  if(!options.name || !options.role) {
    throw new Error(`name, and role must be specified, but they are ${options.name}, ${options.role}`)
  }
  
  const fulloptions = {
    name: options.name,
    runtime: 'nodejs12.x',
    timeout: 60,
    handler: `index.${options.name}`,
    role: options.role, // || 'arn:aws:iam::735406098573:role/lambdaexecute',
    region: options.region || 'us-east-2',
  }

  // spinnies.add(options.path, { text: `Deploying ${options.name} in ${options.language}` })
  // check if lambda has been deployed before
  const exists = await isExistsAmazon(fulloptions)
  // piece together terminal command to deploy
  const uploadCmd = exists === true 
    ? createUpdateCommand(pathToZip, fulloptions)
    : createDeployCommand(pathToZip, fulloptions)

  // deploy/upload
  try {
    console.time(`Amazon-deploy-${options.name}`)
    // TODO sanitize
    const { stdout } = await exec(uploadCmd)
    const arn = extractArn(stdout)
    return arn
  } catch (e) {
    console.log(`Errored amazon deploy: ${e}`)
    // spinnies.fail(options.path, { text: `Deploy Error for ${options.name}: ` })
    throw e
  }
  console.timeEnd(`Amazon-deploy-${options.name}`)
}

module.exports = {
  deployAmazon,
}

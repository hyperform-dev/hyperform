const util = require('util');
const exec = util.promisify(require('child_process').exec);

/**
 * 
 * @description Returns shell command that updates <options.name>'s Lambda's code
 * @param {string} pathToZip 
 * @param {{
 * name: string
 * region: string
 * }} options 
 * @returns {string}
 */
function createUpdateCommand(pathToZip, options) {
  let cmd = `aws lambda update-function-code --function-name ${options.name} --zip-file fileb://${pathToZip}`
  if (options.region) cmd += ` --region ${options.region}`
  return cmd
}

/**
 * @description Returns shell command that newly deploys <options.name> Lambda
 * @param {string} pathToZip 
 * @param {{
  * name: string,
  * runtime: string,
  * handler: string,
  * role: string,
  * timeout?: number,
  * region?: string
  * }} options "timeout" default is 3 seconds. "region" default is the AWS CLI Default region.
  * @returns {string}
  */
function createDeployCommand(pathToZip, options) {
  let cmd = `aws lambda create-function --function-name ${options.name} --runtime ${options.runtime} --role ${options.role} --handler ${options.handler} --zip-file fileb://${pathToZip}`

  if (options.timeout) cmd += ` --timeout ${options.timeout} `
  if (options.region) cmd += ` --region ${options.region}`
  return cmd
}

/**
 * @description Checks whether a Lambda exists in a given region
 * @param {{
 * name: string,
 * region: string
 * }} options 
 * @returns {Promise<boolean>}
 */
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

/**
 * @description Extracts the Lambda ARN from the STDOUT of "aws lambda create-function" 
 * or "aws lambda update-function-code"
 * @param {string} stdout 
 * @returns {string} The Lambda ARN
 */
function extractArn(stdout) {
  // amazon CLI returns JSON, very nice 
  const parsed = JSON.parse(stdout) // TODO fallback on per-line regex
  const arn = parsed.FunctionArn  
  return arn
}

/**
 * @description If Lambda "options.name" does not exist yet in "options.region", 
 * it deploys a new Lambda with given code ("pathToZip") and "options". 
 * If Lambda exists, it just updates its code with "pathToZip", and ignores "options"
 * @param {*} pathToZip Path to the zipped Lambda code
 * @param {{
 * name: string, 
 * role: string, 
 * region?: string,
 * timeout?: number,
 * ram?: number,
 * handler?: string
 * }} options 
 * @returns {Promise<string>} The Lambda ARN
 */
async function deployAmazon(pathToZip, options) {
  if (!options.name || !options.role) {
    throw new Error(`name, and role must be specified, but they are ${options.name}, ${options.role}`)
  }
  
  const fulloptions = {
    name: options.name,
    runtime: 'nodejs12.x',
    timeout: options.timeout || 60, // also prevents 0
    'memory-size': options.ram || 128,
    handler: options.handler || `index.${options.name}`,
    role: options.role, // || 'arn:aws:iam::735406098573:role/lambdaexecute',
    region: options.region || 'us-east-2',
  }
 
  // check if lambda exists already
  const exists = await isExistsAmazon(fulloptions)
  // create shell command
  const uploadCmd = exists === true 
    ? createUpdateCommand(pathToZip, fulloptions)
    : createDeployCommand(pathToZip, fulloptions)

  // run shell command to deploy/update
  let arn 
  try {
    console.time(`Amazon-deploy-${options.name}`)
    // TODO sanitize
    const { stdout } = await exec(uploadCmd)
    arn = extractArn(stdout)
  } catch (e) {
    console.log(`Errored amazon deploy: ${e}`)
    // spinnies.fail(options.path, { text: `Deploy Error for ${options.name}: ` })
    throw e
  }
  console.timeEnd(`Amazon-deploy-${options.name}`)

  return arn
}

module.exports = {
  deployAmazon,
}

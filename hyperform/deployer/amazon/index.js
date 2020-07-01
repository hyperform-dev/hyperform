const util = require('util');
const exec = util.promisify(require('child_process').exec);
const aws = require('aws-sdk')
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
 * @description Creates a new role and attaches basic Lambda policy (AWSLambdaBasicExecutionRole) to it. If role with that name exists already, it just attaches the policy
 * @param {string} roleName Unique name to be given to the role
 * @returns {Promise<string>} ARN of the created or updated role
 * @see https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/using-lambda-iam-role-setup.html
 */
async function createLambdaRole(roleName) {

  const iam = new aws.IAM()

  // Create new Lambda role
  const createParams = {
    AssumeRolePolicyDocument: JSON.stringify(
      {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {
              "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
          }
        ]
      }
    ),
    RoleName: roleName
  }

  let roleArn 
  try {
     let createRes = await iam.createRole(createParams).promise()
     // Role did not exist yet
     roleArn = createRes.Role.Arn 
     console.log("successfully created new role " + roleName + " :" + roleArn)
  } catch(e) {
    if(e.code === 'EntityAlreadyExists') {
      console.log("already exists role " + roleName + " . Proceeding")
      // role with that name already exists
      // proceed normally to attach poilicy
    }
    else {
      // some other error
      throw e
    }
  }


  // Attach a basic Lambda policy to the role (allows write to cloudwatch logs etc)
  // Equivalent to in Lambda console, choosing 'Create new role with basic permissions'
  const policyParams = {
    PolicyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    RoleName: roleName
  }
  await iam.attachRolePolicy(policyParams).promise()
  console.log("successfully attached AWSLambdaBasicExectuinRole to " + roleName)

  return roleArn
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
 * region?: string,
 * timeout?: number,
 * ram?: number,
 * handler?: string
 * }} options 
 * @returns {Promise<string>} The Lambda ARN
 */
async function deployAmazon(pathToZip, options) {
  if (!options.name) {
    throw new Error(`name  must be specified, but is ${options.name}`) // HF programmer mistake
  }

  const existsOptions = {
    name: options.name,
    region: options.region || 'us-east-2' // TODO lol
  }
  // check if lambda exists 
  const exists = await isExistsAmazon(existsOptions)

  // if not, create new role 
  const roleName = `TRY-hyperform-lambda-role-${options.name}`
  const roleArn = await createLambdaRole(roleName)

  const fulloptions = {
    name: options.name,
    runtime: 'nodejs12.x',
    timeout: options.timeout || 60, // also prevents 0
    'memory-size': options.ram || 128,
    handler: options.handler || `index.${options.name}`,
    role: roleArn,
    region: options.region || 'us-east-2',
  }
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

createLambdaRole('my_hf_generated_role_first-8')
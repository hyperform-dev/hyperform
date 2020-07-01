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
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
    ),
    RoleName: roleName,
  }

  let roleArn
  try {
    const createRes = await iam.createRole(createParams).promise()
    // Role did not exist yet
    // Created new role
    roleArn = createRes.Role.Arn
  } catch (e) {
    if (e.code === 'EntityAlreadyExists') {
      // Role with that name already exists
      // TODO GETROLE or SOMETHING SIMILAR 
      // Use that role , proceed normally to attach poilicy
      const getParams = {
        RoleName: roleName,
      }
      console.log(`role with name ${roleName} already exists. getting its arn`)
      const getRes = await iam.getRole(getParams).promise()
      roleArn = getRes.Role.Arn 
    } else {
      // some other error
      throw e
    }
  }

  // for more helpful errors
  if (roleArn == null) {
    throw new Error(`Could not create or get role with name ${roleArn}, Arn is ${roleArn}`)
  }

  // Attach a basic Lambda policy to the role (allows write to cloudwatch logs etc)
  // Equivalent to in Lambda console, choosing 'Create new role with basic permissions'
  const policyParams = {
    PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    RoleName: roleName,
  }
  await iam.attachRolePolicy(policyParams).promise()
  console.log(`successfully attached AWSLambdaBasicExectuinRole to ${roleName}`)

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
 * region: string,
 * timeout?: number,
 * ram?: number,
 * handler?: string
 * }} options 
 * @returns {Promise<string>} The Lambda ARN
 */
async function deployAmazon(pathToZip, options) {
  if (!options.name || !options.region) {
    throw new Error(`name and region must be specified, but are ${options.name}, ${options.region}`) // HF programmer mistake
  }

  const existsOptions = {
    name: options.name,
    region: options.region,
  }
  // check if lambda exists 
  const exists = await isExistsAmazon(existsOptions)

  // if not, create new role 
  const roleName = `hyperform-r2-${options.name}`
  const roleArn = await createLambdaRole(roleName)

  const fulloptions = {
    name: options.name,
    region: options.region,
    role: roleArn,
    runtime: 'nodejs12.x',
    timeout: options.timeout || 60, // also prevents 0
    'memory-size': options.ram || 128,
    handler: options.handler || `index.${options.name}`,
  }
  // create shell command
  const uploadCmd = exists === true
    ? createUpdateCommand(pathToZip, fulloptions)
    : createDeployCommand(pathToZip, fulloptions)

  // run shell command to deploy/update
  let arn
  const tryUpload = async () => {
    const { stdout } = await exec(uploadCmd)
    arn = extractArn(stdout)
    return arn
  }
  const sleep = async (millis) => new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, millis);
  })

  // tryUpload might throw if we create Lambda just after role creation
  // Just wait and retry
  // See: https://stackoverflow.com/a/37503076

  for (let i = 0; i < 4; i += 1) {
    try {
      console.log('trying to upload to amazon')
      arn = await tryUpload()
      console.log('success uploading to amazon')
      break // we're done
    } catch (e) {
      // TODO write test that enters here, reliably
      if (e.code === 'InvalidParameterValueException') {
        console.log('amazon deploy threw InvalidParameterValueException (role not ready yet). Retrying in 3 seconds...')
        await sleep(3000) // wait 3 seconds
        continue
      } else {
        console.log(`Amazon upload errorred forrreal: ${e}`)
        console.log(JSON.stringify(e, null, 2))
        throw e;
      }
    }
  }

  console.timeEnd(`Amazon-deploy-${options.name}`)

  return arn
}

/**
 * @description Deletes a Lambda function in a given region.
 * @param {string} name Name, ARN or partial ARN of the function
 * @param {string} region Region of the function
 * @throws ResourceNotFoundException, among others
 */
async function deleteAmazon(name, region) { 
  const lambda = new aws.Lambda({
    region: region, 
  })

  const deleteParams = {
    FunctionName: name, 
  }
 
  await lambda.deleteFunction(deleteParams).promise()
}

module.exports = {
  deployAmazon,
  deleteAmazon,
}

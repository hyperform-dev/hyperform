const util = require('util');
const exec = util.promisify(require('child_process').exec);
const AWS = require('aws-sdk')
const fsp = require('fs').promises
const { logdev } = require('../../printers/index')

const conf = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION, 
  // may, may not be defined
  // sessionToken: process.env.AWS_SESSION_TOKEN || undefined, 
}

if (process.env.AWS_SESSION_TOKEN != null && process.env.AWS_SESSION_TOKEN !== 'undefined') {
  conf.sessionToken = process.env.AWS_SESSION_TOKEN
}

AWS.config.update(conf)

/**
 * @description Creates a new Lambda with given function code and options
 * @param {string} pathToZip Path to the zipped Lambda code
 * @param {{
 * name: string, 
 * region: string,
 * role: string,
 * runtime: string,
 * timeout: number,
 * ram: number,
 * handler: string
 * }} options
 * @returns {Promise<string>} The ARN of the Lambda
 * @throws If Lambda exists or creation did not succeed
 */
async function createLambda(pathToZip, options) {
  const lambda = new AWS.Lambda({
    region: options.region,
    apiVersion: '2015-03-31',
  })

  const zipContents = await fsp.readFile(pathToZip)
  const params = {
    Code: {
      ZipFile: zipContents,
    },
    FunctionName: options.name,
    Timeout: options.timeout,
    Role: options.role,
    MemorySize: options.ram, 
    Handler: options.handler, 
    Runtime: options.runtime,
  }

  const res = await lambda.createFunction(params).promise()
  const arn = res.FunctionArn

  return arn
}

/**
 * @description Deletes a Lambda function in a given region.
 * @param {string} name Name, ARN or partial ARN of the function
 * @param {string} region Region of the function
 * @throws ResourceNotFoundException, among others
 */
async function deleteLambda(name, region) { 
  const lambda = new AWS.Lambda({
    region: region, 
    apiVersion: '2015-03-31',
  })

  const params = {
    FunctionName: name, 
  }
 
  await lambda.deleteFunction(params).promise()
}

/**
 * @description Updates a Lambda's function code with a given .zip file
 * @param {string} pathToZip Path to the zipped Lambda code
 * @param {{
 * name: string,
 * region: string
 * }} options 
 * @throws If Lambda does not exist or update did not succeed
 * @returns {Promise<string>} The ARN of the Lambda
 */
async function updateLambdaCode(pathToZip, options) {
  const lambda = new AWS.Lambda({
    region: options.region,
    apiVersion: '2015-03-31',
  })

  const zipContents = await fsp.readFile(pathToZip)

  const params = {
    FunctionName: options.name,
    ZipFile: zipContents,
  }

  const res = await lambda.updateFunctionCode(params).promise()
  const arn = res.FunctionArn
  
  return arn
}

/**
 * @description Creates a new role, and attaches a basic Lambda policy 
 * (AWSLambdaBasicExecutionRole) to it. If role with that name 
 * exists already, it just attaches the policy to it
 * @param {string} roleName Unique name to be given to the role
 * @returns {Promise<string>} ARN of the created or updated role
 * @see https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/using-lambda-iam-role-setup.html
 */
async function createLambdaRole(roleName) {
  const iam = new AWS.IAM()

  const lambdaPolicy = {
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
  }

  const createParams = {
    AssumeRolePolicyDocument: JSON.stringify(lambdaPolicy),
    RoleName: roleName,
  }

  let roleArn
  try {
    const createRes = await iam.createRole(createParams).promise()
    // Role did not exist yet
    roleArn = createRes.Role.Arn
  } catch (e) {
    if (e.code === 'EntityAlreadyExists') {
      // Role with that name already exists
      // Use that role, proceed normally
      const getParams = {
        RoleName: roleName,
      }
      logdev(`role with name ${roleName} already exists. getting its arn`)
      const getRes = await iam.getRole(getParams).promise()
      roleArn = getRes.Role.Arn 
    } else {
      // some other error
      throw e
    }
  }

  // Attach a basic Lambda policy to the role (allows writing to cloudwatch logs etc)
  // Equivalent to in Lambda console, selecting 'Create new role with basic permissions'
  const policyParams = {
    PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    RoleName: roleName,
  }
  await iam.attachRolePolicy(policyParams).promise()
  logdev(`successfully attached AWSLambdaBasicExecutionRole to ${roleName}`)

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
  const lambda = new AWS.Lambda({
    region: options.region,
    apiVersion: '2015-03-31',
  })

  const params = {
    FunctionName: options.name,
  }

  try {
    await lambda.getFunction(params).promise()
    return true
  } catch (e) {
    if (e.code === 'ResourceNotFoundException') {
      return false 
    } else {
      // some other error
      throw e
    }
  }
}

// TODO
// /**
//  * @throws If Lambda does not exist
//  */
// async function updateLambdaConfiguration() {

// }

module.exports = {
  createLambda,
  deleteLambda,
  updateLambdaCode,
  createLambdaRole,
  isExistsAmazon,
}

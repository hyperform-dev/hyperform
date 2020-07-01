const util = require('util');
const exec = util.promisify(require('child_process').exec);
const aws = require('aws-sdk')
const apigatewayv2 = new aws.ApiGatewayV2({
  region: 'us-east-2'
})

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


// TODO handle regional / edge / read up on how edge works
// TODO don't create 
/**
 * * Takes Lambda ARN and makes it public with API gateway
 * @returns {string} HTTP endpoint of lambda
 * @param {string} lambdaArn 
 */

 // TODO do we need to publish 1 or N times for every lambda deploy?
async function _publishAmazon(lambdaArn) {
  const lambdaName = lambdaArn.split(':').slice(-1)[0]
  const apiName = `hyperform-${lambdaName}`

  // TODO Check if API exists, if so do nothing
  // should Follows Hyperform conv: same name implies identical, for lambdas, and api endpoints etc
  
  //  const existsCmd = `aws apigatewayv2 get-api --api-id ${xx}` 
  // TODO query
  // aws apigatewayv2 get-apis --query 'items[?name==`first-http-api`]'
  

  // can be run multiple times, produces new URLs(not ideal)
  const cmd1 = `aws apigatewayv2 create-api --name ${apiName} --protocol-type HTTP --target ${lambdaArn}`

  let { stdout } = await exec(cmd1, { encoding: 'utf-8'})
  let parsedstdout = JSON.parse(stdout)

  const apiUrl = parsedstdout.ApiEndpoint
  const apiId = parsedstdout.ApiId



  // add permission to that lambda to be accessed by API gateway
  // nice and easy now and has only to be done 1 (will throw on subsequent)
  // später gleich, statt N dupe APIs 1 API, kann man spezifisch der api access der lambda erlauben

  const cmd2 = `aws lambda add-permission --function-name ${lambdaName} --action lambda:InvokeFunction --statement-id hyperform-statement-${lambdaName} --principal apigateway.amazonaws.com`

  try {
    await exec(cmd2)
  //  console.log(`Authorized Gateway to access ${lambdaName}`)
  } catch(e) {
    // means statement exists already - means API gateway is already auth to access that lambda
   // console.log(`Probably already authorized to access ${lambdaName}`)
   // surpress throw e
  }

  return apiUrl
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

  // publish (create URL with API Gateway)
  const url = await _publishAmazon(arn)
  return url
  
}

module.exports = {
  deployAmazon,
}

const util = require('util')
const exec = util.promisify(require('child_process').exec);
const AWS = require('aws-sdk')
const { log, logdev } = require('../../printers/index')

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION, 
})

/**
 * @description Creates a new REGIONAL API in "region" named "apiName" that 
 * forwards requests to the "targetlambdaArn" Lambda
 * @param {string} apiName Name of API
 * @param {string} targetlambdaArn ARN of Lambda where requests should be forwarded to
 * @param {string} apiRegion 
 * @returns {Promise<{apiId: string, apiUrl: string}>} Id and URL of the endpoint
 * // TODO throws on existing? 
 */
async function createApi(apiName, targetlambdaArn, apiRegion) {
  const apigatewayv2 = new AWS.ApiGatewayV2({
    apiVersion: '2018-11-29',
    region: apiRegion, 
  })

  const createApiParams = {
    Name: apiName,
    ProtocolType: 'HTTP',
    // TODO regional is default, but how the to set to EDGE later on?
    // EndpointType: 'REGIONAL', // invalid field
    Target: targetlambdaArn,
  }

  const createApiRes = await apigatewayv2.createApi(createApiParams).promise()

  const res = {
    apiId: createApiRes.ApiId,
    apiUrl: createApiRes.ApiEndpoint,
  }
  
  return res 
}

/**
 * 
 * @param {string} apiId 
 * @param {string} apiRegion 
 * @returns {Promise<void>}
 */
async function deleteApi(apiId, apiRegion) {
  const apigatewayv2 = new AWS.ApiGatewayV2({
    apiVersion: '2018-11-29',
    region: apiRegion, 
  })
  const deleteApiParams = {
    ApiId: apiId,
  }
  await apigatewayv2.deleteApi(deleteApiParams).promise()
}

/**
 * @description Returns ApiId and ApiEndpoint of a regional API gateway API
 *  with the name "apiName", in "apiRegion".
 * If multiple APIs exist with that name, it warns, and uses the first one in the received list. 
 * If none exist, it returns null.
 * @param {string} apiName 
 * @param {string} apiRegion
 * @returns {Promise<{apiId: string, apiUrl: string}>} Details of the API, or null
 */
async function getApiDetails(apiName, apiRegion) {
  // Check if API with that name exists
  // Follows Hyperform conv: same name implies identical, for lambdas, and api endpoints etc
  const apigatewayv2 = new AWS.ApiGatewayV2({
    apiVersion: '2018-11-29',
    region: apiRegion,
  })

  const getApisParams = {
    MaxResults: '9999',
  }

  const res = await apigatewayv2.getApis(getApisParams).promise()

  const matchingApis = res.Items.filter((item) => item.Name === apiName)
  if (matchingApis.length === 0) {
    // none exist
    return null 
  }

  if (matchingApis.length >= 2) {
    log(`Multiple (${matchingApis.length}) APIs found with same name ${apiName}. Using first one`)
  }

  // just take first one
  // Hyperform convention is there's only one with any given name
  const apiDetails = {
    apiId: matchingApis[0].ApiId,
    apiUrl: matchingApis[0].ApiEndpoint,
  }

  return apiDetails
}

/**
 * @description Add permssion to allow API gateway to invoke given Lambda
 * @param {string} lambdaName Name of Lambda
 * @param {string} region Region of Lambda
 * @returns {Promise<void>}
 */
async function allowApiGatewayToInvokeLambda(lambdaName, region) {
  const lambda = new AWS.Lambda({
    region: region,
    apiVersion: '2015-03-31', 
  })

  const addPermissionParams = {
    Action: 'lambda:InvokeFunction',
    FunctionName: lambdaName,
    Principal: 'apigateway.amazonaws.com',
    // TODO SourceArn https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#addPermission-property
    StatementId: `hf-stmnt-${lambdaName}`,
  }
 
  try {
    await lambda.addPermission(addPermissionParams).promise()
  } catch (e) {
    if (e.code === 'ResourceConflictException') {
      // API Gateway can already access that lambda (happens on all subsequent deploys), cool
    } else {
      logdev(`addpermission: some other error: ${e}`)
      throw e
    }
  }    
}

module.exports = {
  createApi,
  _only_for_testing_deleteApi: deleteApi,
  allowApiGatewayToInvokeLambda,
  getApiDetails,
}

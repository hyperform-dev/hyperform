const util = require('util')
const exec = util.promisify(require('child_process').exec);
const AWS = require('aws-sdk')

/**
 * @description Creates a new REGIONAL API in "region" named "apiName" that 
 * forwards requests to the "targetlambdaArn" Lambda
 * @param {string} apiName Name of API
 * @param {string} targetlambdaArn ARN of Lambda where requests should be forwarded to
 * @param {string} region 
 * @returns {Promise<{apiId: string, apiUrl: string}>} Id and URL of the endpoint
 * // TODO throws on existing? 
 */
async function createApi(apiName, targetlambdaArn, region) {
  const apigatewayv2 = new AWS.ApiGatewayV2({
    apiVersion: '2018-11-29',
    region: region, 
  })

  const createApiParams = {
    Name: apiName,
    ProtocolType: 'HTTP',
    EndpointType: 'REGIONAL',
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
 * @description Returns ApiId and ApiEndpoint of the a API gateway API with the name "apiName".
 * If multiple APIs exist with that name, it warns, and uses the first one in the received list.
 * If none exist, returns null
 * @param {string} apiName 
 * @returns {Promise<{apiId: string, apiUrl: string}>} Details of the API, or null
 */
async function getApiDetails(apiName) {
  // Check if API with that name exists
  // Follows Hyperform conv: same name implies identical, for lambdas, and api endpoints etc
  const cmd = `aws apigatewayv2 get-apis --query 'Items[?Name==\`${apiName}\`]'`
  const res = await exec(cmd, { encoding: 'utf-8' })
  const { stdout } = res 
  
  const parsedStdout = JSON.parse(stdout)
  
  if (parsedStdout.length > 0) {
    // API with that name exists already
    // use that one
    if (parsedStdout.length !== 1) {
      // Against HF convention but does not impact us anywhere really so just tolerate it
      console.warn(`Multiple (${parsedStdout.length}) APIs found with same name ${apiName}. Using first one`)
    }

    return {
      apiId: parsedStdout[0].ApiId,
      apiUrl: parsedStdout[0].ApiEndpoint,
    }
  } else {
    return null
  }
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
      console.log('addpermission: some other error: ', e)
      throw e
    }
  }    
}

module.exports = {
  createApi,
  allowApiGatewayToInvokeLambda,
  getApiDetails,
}

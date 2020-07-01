const { createApi, allowApiGatewayToInvokeLambda, getApiDetails } = require('./utils')
const { deployAuthorizerLambda, setDefaultRouteAuthorizer, detachDefaultRouteAuthorizer } = require('../../authorizer-gen/index')
// TODO handle regional / edge / read up on how edge works

/**
 * @description Creates a public HTTP endpoint that forwards request to a given Lambda.
 * If needAuth is true, the resulting 
 * HTTP endpoint will return 403 or 401,
 * unless the HTTP headers contain 'Authorization: Bearer "expectedBearer"'
 * @param {string} lambdaArn 
 * @param {{ region: string, needAuth: boolean, expectedBearer?: string }} options 
 * @returns {Promise<string>} HTTP endpoint URL of the Lambda
 */
async function publishAmazon(lambdaArn, { needAuth, expectedBearer, region }) {
  // TODO do we need to publish 1 or N times for every lambda deploy?
  if (typeof needAuth !== 'boolean') throw new Error(`PublishAmazon: needAuth must be true|false but is ${needAuth}`) // TODO HF programmer errors, do not check for
  if (needAuth === true && typeof expectedBearer !== 'string') throw new Error(`PublishAmazon: needAuth is false but expectedBearer isn't a string: ${expectedBearer}`)
 
  const lambdaName = lambdaArn.split(':').slice(-1)[0]
  const apiName = `hf-${lambdaName}`

  let apiId 
  let apiUrl
  
  // Check if API with that name exists
  // Follows Hyperform convention: same name implies identical
  const apiDetails = await getApiDetails(apiName, region)

  // exists
  // use it
  if (apiDetails != null && apiDetails.apiId != null && apiDetails.apiUrl != null) {
    apiId = apiDetails.apiId
    apiUrl = apiDetails.apiUrl
    // does not exist
    // create one
  } else {
    const createRes = await createApi(apiName, lambdaArn, region)
    apiId = createRes.apiId
    apiUrl = createRes.apiUrl
  }

  // Add permission to that lambda to be accessed by API gateway
  // nice and easy now and has only to be done 1 (will throw on subsequent)
  // todo iwann spezifisch der api access der lambda erlauben via SourceArn
  
  await allowApiGatewayToInvokeLambda(lambdaName, region)
  
  if (needAuth === false) {
    // detach authorizer, if any 
    await detachDefaultRouteAuthorizer(apiId, region)
    return apiUrl
  } else {
    // Deploy Lambda authorizer and set it https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html
    const authorizerName = `${lambdaName}-authorizer` // -v0
    // create authorizer lambda
    const authorizerOptions = { 
      region: region,
    }
    const authorizerArn = await deployAuthorizerLambda(authorizerName, expectedBearer, authorizerOptions)
    // set authorizer
    await setDefaultRouteAuthorizer(apiId, authorizerArn, region)
  
    return apiUrl
  }
}

module.exports = {
  publishAmazon,
}

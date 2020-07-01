const { createApi, allowApiGatewayToInvokeLambda, getApiDetails } = require('./utils')
const { deployAuthorizer, setAuthorizer } = require('../../authorizer-gen/index')
// TODO handle regional / edge / read up on how edge works

/**
 * @description Creates a public HTTP endpoint that forwards request to a given Lambda.
 * If allowUnauthenticated is false, the resulting 
 * HTTP endpoint will return 403 or 401,
 * unless the HTTP headers contain 'Authorization: Bearer "bearerToken"'
 * @param {string} lambdaArn 
 * @param {{ region: string, allowUnauthenticated: boolean, bearerToken?: string }} options 
 * @returns {Promise<string>} HTTP endpoint URL of the Lambda
 */
async function publishAmazon(lambdaArn, { allowUnauthenticated, bearerToken, region }) {
  // TODO do we need to publish 1 or N times for every lambda deploy?
  if (typeof allowUnauthenticated !== 'boolean') throw new Error(`PublishAmazon: allowUnauthenticated must be true|false but is ${allowUnauthenticated}`) // TODO HF programmer errors, do not check for
  if (allowUnauthenticated === false && bearerToken == null) throw new Error(`PublishAmazon: allowUnauthenticated is false but bearerToken is not specified: ${bearerToken}`)
  if (typeof bearerToken !== 'string') throw new Error(`bearerToken must be string but is: ${bearerToken}`)

  const lambdaName = lambdaArn.split(':').slice(-1)[0]
  const apiName = `hf-${lambdaName}`

  let apiId 
  let apiUrl
  
  // Check if API with that name exists
  // Follows Hyperform convention: same name implies identical
  const apiDetails = await getApiDetails(apiName)

  // exists
  // use it
  if (apiDetails != null && apiDetails.apiId != null && apiDetails.apiUrl != null) {
    apiId = apiDetails.apiId
    apiUrl = apiDetails.apiUrl
    // does not exist
    // create one
  } else {
    const createRes = await createApi(apiName, lambdaArn)
    apiId = createRes.apiId
    apiUrl = createRes.apiUrl
  }

  // Add permission to that lambda to be accessed by API gateway
  // nice and easy now and has only to be done 1 (will throw on subsequent)
  // todo iwann spezifisch der api access der lambda erlauben via SourceArn
  
  await allowApiGatewayToInvokeLambda(lambdaName, region)
  
  if (allowUnauthenticated === true) {
    // Don't deploy authorizer
    return apiUrl
  } else {
    // Deploy Lambda authorizer and set it https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html
    const authorizerName = `${lambdaName}-authorizer` // -v0
    // create authorizer lambda
    const authorizerOptions = { 
      region: region,
    }
    const authorizerArn = await deployAuthorizer(authorizerName, bearerToken, authorizerOptions)
    // set authorizer
    await setAuthorizer(apiId, authorizerArn)
  
    return apiUrl
  }
}

module.exports = {
  publishAmazon,
}

const { createApi, allowApiGatewayToInvokeLambda, getApiDetails } = require('./utils')
// TODO handle regional / edge / read up on how edge works

/**
 * @description Creates a public HTTP endpoint that forwards request to a given Lambda.
 * @param {string} lambdaArn 
 * @param {string} region
 * @returns {Promise<string>} HTTP endpoint URL of the Lambda
 */
async function publishAmazon(lambdaArn, region) {
  const lambdaName = lambdaArn.split(':').slice(-1)[0]
  const apiName = `hf-${lambdaName}`

  let apiId 
  let apiUrl
  
  // Check if API with that name exists
  // Follows Hyperform convention: same name implies identical
  const apiDetails = await getApiDetails(apiName, region)

  // exists
  // use it
  if (apiDetails != null && apiDetails.apiUrl != null) {
    apiUrl = apiDetails.apiUrl
    // does not exist
    // create one
  } else {
    const createRes = await createApi(apiName, lambdaArn, region)
    apiUrl = createRes.apiUrl
  }

  // Add permission to that lambda to be accessed by API gateway
  // nice and easy now and has only to be done 1 (will throw on subsequent)
  // todo iwann spezifisch der api access der lambda erlauben via SourceArn
  
  await allowApiGatewayToInvokeLambda(lambdaName, region)
  
  return apiUrl
}

module.exports = {
  publishAmazon,
}

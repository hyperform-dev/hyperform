const {
  createApi, 
  createIntegration, 
  createDefaultAutodeployStage, 
  setRoute, 
  allowApiGatewayToInvokeLambda, 
  getApiDetails, 
} = require('./utils')
// TODO handle regional / edge / read up on how edge works

const HFAPINAME = 'hyperform-v1'

/**
 * @description Creates a public HTTP endpoint that forwards request to a given Lambda.
 * @param {string} lambdaArn 
 * @param {string} region
 * @returns {Promise<string>} Full endpoint URL, eg. https://48ytz1e6f3.execute-api.us-east-2.amazonaws.com/endpoint-hello
 */
async function publishAmazon(lambdaArn, region) {
  const lambdaName = lambdaArn.split(':').slice(-1)[0]
  // Lambda 'endpoint-hello' should be at 'https://.../endpoint-hello'
  const routePath = `/${lambdaName}`

  /// ///////////////////////////////////////////////
  /// //ensure HF API exists in that region /////////
  // TODO to edge
  /// //////////////////////////////////////////////

  let hfApiId 
  let hfApiUrl

  /// ///////////////////////////////////////////////
  /// Check if HF umbrella API exists in that region
  /// //////////////////////////////////////////////
  
  const apiDetails = await getApiDetails(HFAPINAME, region)
  // exists
  // use it
  if (apiDetails != null && apiDetails.apiId != null) {
    hfApiId = apiDetails.apiId
    hfApiUrl = apiDetails.apiUrl
    // does not exist
    // create HF API
  } else {
    const createRes = await createApi(HFAPINAME, region)
    hfApiId = createRes.apiId
    hfApiUrl = createRes.apiUrl
  }
  
  /// ///////////////////////////////////////////////
  /// Add permission to API to lambda accessed by API gateway
  /// //////////////////////////////////////////////

  // todo iwann spezifisch der api access der lambda erlauben via SourceArn
  await allowApiGatewayToInvokeLambda(lambdaName, region)

  /// ///////////////////////////////////////////////
  ///  Create integration that represents the Lambda
  /// //////////////////////////////////////////////

  const integrationId = await createIntegration(hfApiId, region, lambdaArn)

  /// ///////////////////////////////////////////////
  ///  Create $default Auto-Deploy stage
  /// //////////////////////////////////////////////

  try {
    await createDefaultAutodeployStage(hfApiId, region)
  } catch (e) {
    // already exists (shouldn't throw because of anything other)
    // nice
  }

  /// ///////////////////////////////////////////////
  /// Create / update route with that integration
  /// //////////////////////////////////////////////

  await setRoute(
    hfApiId,
    region,
    routePath,
    integrationId,
  )

  const endpointUrl = hfApiUrl + routePath

  return endpointUrl
}

module.exports = {
  publishAmazon,
}

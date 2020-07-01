const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { deployAuthorizer, setAuthorizer } = require('../../authorizer-gen/index')
// TODO handle regional / edge / read up on how edge works

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
 * @description Creates a new API named "apiName" that 
 * forwards requests to the "targetlambdaArn" Lambda
 * @param {string} apiName Name of API
 * @param {string} targetlambdaArn ARN of Lambda where requests should be forwarded to
 * @returns {Promise<{apiId: string, apiUrl: string}>} Id and URL of the endpoint
 * // TODO throws on existing? 
 */
async function createApi(apiName, targetlambdaArn) {
  const cmd = `aws apigatewayv2 create-api --name ${apiName} --protocol-type HTTP --target ${targetlambdaArn}`
    
  const { stdout } = await exec(cmd, { encoding: 'utf-8' })
  const parsedStdout = JSON.parse(stdout)

  return {
    apiId: parsedStdout.ApiId,
    apiUrl: parsedStdout.ApiEndpoint,
  }
}

/**
 * @description Creates a public HTTP endpoint that forwards request to a given Lambda.
 * If allowUnauthenticated is false, the resulting 
 * HTTP endpoint will return 403 or 401,
 * unless the HTTP headers contain 'Authorization: Bearer "bearerToken"'
 * @param {string} lambdaArn 
 * @param {{ allowUnauthenticated: boolean, bearerToken?: string }} param1 
 * @returns {Promise<string>} HTTP endpoint URL of the Lambda
 */
async function publishAmazon(lambdaArn, { allowUnauthenticated, bearerToken }) {
  // TODO do we need to publish 1 or N times for every lambda deploy?
  if (typeof allowUnauthenticated !== 'boolean') throw new Error(`PublishAmazon: allowUnauthenticated must be true|false but is ${allowUnauthenticated}`) // TODO HF programmer error, do not check for
  if (allowUnauthenticated === false && bearerToken == null) throw new Error(`PublishAmazon: allowUnauthenticated is false but bearerToken is not specified: ${bearerToken}`)
  if (typeof bearerToken !== 'string') throw new Error(`bearerToken must be string but is: ${bearerToken}`)

  const lambdaName = lambdaArn.split(':').slice(-1)[0]
  const apiName = `hyperform-${lambdaName}`

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
  // todo iwann spezifisch der api access der lambda erlauben

  {
    const cmd = `aws lambda add-permission --function-name ${lambdaName} --action lambda:InvokeFunction --statement-id hyperform-statement-${lambdaName} --principal apigateway.amazonaws.com`
  
    try {
      await exec(cmd)
    } catch (e) {
      // means statement exists already - means API gateway is already auth to access that lambda
    }    
  }
  
  if (allowUnauthenticated === true) {
    // do nothing
    // default is allow unauthenticated
    
    return apiUrl
  }
  
  // Deploy Lambda authorizer and set it https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html
  if (allowUnauthenticated === false) {
    const authorizerName = `${lambdaName}-authorizer` // -v0
    // create authorizer lambda
    const authorizerArn = await deployAuthorizer(authorizerName, bearerToken)
    // set authorizer
    await setAuthorizer(apiId, authorizerArn)

    return apiUrl
  }

  // exhaustive
  throw new Error(`allowUnauthenticated must be true or false but is ${allowUnauthenticated}`)
}

module.exports = {
  publishAmazon,
}

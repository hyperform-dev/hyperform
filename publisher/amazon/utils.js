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
 * @description Creates a new REGIONAL API in "region" named "apiName"
 * @param {string} apiName Name of API
 * @param {string} apiRegion 
 * @returns {Promise<{apiId: string, apiUrl: string}>} Id and URL of the endpoint
 */
async function createApi(apiName, apiRegion) {
  const apigatewayv2 = new AWS.ApiGatewayV2({
    apiVersion: '2018-11-29',
    region: apiRegion,
  })

  // @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ApiGatewayV2.html#createApi-property
  const createApiParams = {
    Name: apiName,
    ProtocolType: 'HTTP',
    // TODO regional is default, but how the to set to EDGE later on?
    // EndpointType: 'REGIONAL', // invalid field
    // Target: targetlambdaArn, // TODO
    CorsConfiguration: {
      AllowMethods: [
        'POST',
        'GET',
      ],
      AllowOrigins: [
        '*',
      ],
    },
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
 * @description Returns the IntegrationId of the integration that matches 'name', or null.
 * If multiple exist, it returns the IntegrationId of the first one in the list.
 * @param {*} apiId 
 * @param {*} apiRegion 
 * @param {*} name 
 */
async function getIntegrationId(apiId, apiRegion, name) {
  // On amazon, integration names are not unique, 
  // but HF treats the as unique
  // and always reuses them
  const apigatewayv2 = new AWS.ApiGatewayV2({
    apiVersion: '2018-11-29',
    region: apiRegion,
  })

  const getParams = {
    ApiId: apiId,
    MaxResults: '9999',
  }

  // Get all integrations
  let res = await apigatewayv2.getIntegrations(getParams).promise()

  res = res.Items 
    // Only integrations that match name
    .filter((el) => el.IntegrationUri.split(':')[-1] === name)

  // Just take the first one 
  res = res[0]

  if (res && res.IntegrationId) {
    return res.IntegrationId
  } else {
    return null
  }
}

/**
 * @description Gets route Ids of GET and POST methods that match routePath
 * @param {*} apiId 
 * @param {*} apiRegion 
 * @param {*} routePath 
 * @returns {[ { AuthorizationType: string, RouteId: string, RouteKey: string }]}
 */
async function getGETPOSTRoutesAt(apiId, apiRegion, routePath) {
  const apigatewayv2 = new AWS.ApiGatewayV2({
    apiVersion: '2018-11-29',
    region: apiRegion,
  })

  // TODO Amazon might return a paginated response here  (?)
  // In that case with many routes, the route we look for may not be on first page
  const params = {
    ApiId: apiId,
    MaxResults: '9999', // string according to docs and it works... uuh?
  }

  const res = await apigatewayv2.getRoutes(params).promise() 

  const matchingRoutes = res.Items
    .filter((item) => item.RouteKey && item.RouteKey.includes(routePath) === true)
    // only GET and POST ones
    .filter((item) => /GET|POST/.test(item.RouteKey) === true)

  return matchingRoutes
}

/**
 * Creates or update GET and POST routes with an integration. 
 * If only one of GET or POST routes exist (user likely deleted one of them),
 * it updates that one. 
 * Otherwise, it creates new both GET, POST routes.
 *  Use createDefaultAutodeployStage too when creating, so that changes are made public
 * @param {*} apiId 
 * @param {*} apiRegion 
 * @param {*} routePath '/endpoint-1' for example
 * @param {*} integrationId
 */
async function setRoute(apiId, apiRegion, routePath, integrationId) {
  const apigatewayv2 = new AWS.ApiGatewayV2({
    apiVersion: '2018-11-29',
    region: apiRegion,
  })

  // Get route ids of GET & POST at that routePath
  const routes = await getGETPOSTRoutesAt(apiId, apiRegion, routePath)

  if (routes.length > 0) {
    /// ////////////////////////////////////////////////
    // Update routes (GET, POST) with integrationId
    /// ////////////////////////////////////////////////

    console.log('UPDATING ROUTES', routes)

    await Promise.all(
      routes.map(async (r) => {
        // skip if integration id is set correctly already
        if (r.Target && r.Target === `integrations/${integrationId}`) {
          return
        }

        const updateRouteParams = {
          ApiId: apiId,
          AuthorizationType: 'NONE',
          RouteId: r.RouteId,
          RouteKey: r.RouteKey,
          Target: `integrations/${integrationId}`,
        }

        try {
          const updateRes = await apigatewayv2.updateRoute(updateRouteParams).promise()
        } catch (e) {
          // This happens eg when there is only one of GET OR POST route (routes.length > 0)
          // Usually when the user deliberately deleted one of the
          // Ignore, as it's likely intented
        }
      }),
    )
  } else {
    console.log('CREATING NEW ROUTES')
    /// ////////////////////////////////////////////////
    // Create routes (GET, POST) with integrationId
    /// ////////////////////////////////////////////////
    
    // Create GET route
    const createGETRouteParams = {
      ApiId: apiId,
      AuthorizationType: 'NONE',
      RouteKey: `GET ${routePath}`,
      Target: `integrations/${integrationId}`,
    }

    const createGETRes = await apigatewayv2.createRoute(createGETRouteParams).promise()

    // Create POST route
    const createPOSTRouteParams = { ...createGETRouteParams }
    createPOSTRouteParams.RouteKey = `POST ${routePath}`

    const createPOSTRes = await apigatewayv2.createRoute(createPOSTRouteParams).promise()
  }
}

/**
 * Creates a (possibly duplicate) integration that can be attached. 
 * Before creating, check getIntegrationId to avoid duplicates
 * @param {*} apiId 
 * @param {*} apiRegion 
 * @param {string} targetLambdaArn For instance a Lambda ARN
 * @returns {string} IntegrationId
 */
async function createIntegration(apiId, apiRegion, targetLambdaArn) {
  const apigatewayv2 = new AWS.ApiGatewayV2({
    apiVersion: '2018-11-29',
    region: apiRegion,
  })

  const params = {
    ApiId: apiId,
    IntegrationType: 'AWS_PROXY',
    IntegrationUri: targetLambdaArn,
    PayloadFormatVersion: '2.0',
  }

  const res = await apigatewayv2.createIntegration(params).promise()
  const integrationId = res.IntegrationId 

  return integrationId
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
 * 
 * @param {*} apiId 
 * @param {*} apiRegion 
 * @throws If $default stage already exists
 */
async function createDefaultAutodeployStage(apiId, apiRegion) {
  const apigatewayv2 = new AWS.ApiGatewayV2({
    apiVersion: '2018-11-29',
    region: apiRegion,
  })
  const params = {
    ApiId: apiId,
    StageName: '$default',
    AutoDeploy: true,
  }

  const res = await apigatewayv2.createStage(params).promise()

  console.log(res)
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
  createIntegration,
  setRoute,
  createDefaultAutodeployStage,
}

// createIntegration(
//   'vca3i8138h',
//   'us-east-2',
//   'arn:aws:lambda:us-east-2:735406098573:function:endpoint_logInput',
// )
// .then((iid) => {
//   console.log(`integration id:${iid}`)

//   console.log(res)
// })

// getIntegrationId('vca3i8138h', 'us-east-2')
// getRouteId('vca3i8138h', 'us-east-2')

// const res = setRoute(
//   'vca3i8138h',
//   'us-east-2',
//   'GET',
//   '/some_cool_routexxx',
//   'eqfiitp',
// )

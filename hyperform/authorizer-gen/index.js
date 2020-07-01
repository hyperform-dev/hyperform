const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { deployAmazon } = require('../deployer/amazon')
const { zip } = require('../zipper/index')

/**
 * 
 * @param {string} authorizerName For example 'myfn-authorizer'
 * @param {string} expectedBearer 'Authorization': 'Bearer {expectedBearer}' 
 * @returns {string} ARN of the created authorizer lambda
 */
async function deployAuthorizer(authorizerName, expectedBearer) {
  // avoid accidentally empty bearer
  // Any request with 'Bearer' would be let through
  if (!expectedBearer || !expectedBearer.trim()) {
    throw new Error('deployAuthorizer: expectedBearer is required')
  }
  // will mess up weird user-given Tokens but that's on the user
  // will lead to false negatives (still better than false positives or injections)
  const sanitizedExpectedBearer = encodeURI(expectedBearer)

  const authorizerCode = `
  exports.handler = async(event) => {
    const expected = \`Bearer ${sanitizedExpectedBearer}\`
    const isAuthorized = (event.headers.authorization === expected)
    return {
      isAuthorized
    }
  };
  `
  // TODO do this private somehow that no program can tamper with authorizer zip
  const zipPath = await zip(authorizerCode)

  const deployOptions = {
    name: authorizerName,
    role: 'arn:aws:iam::735406098573:role/lambdaexecute',
    timeout: 1, // 1 second is ample time
    handler: 'index.handler',
  }
  const authorizerArn = await deployAmazon(zipPath, deployOptions)

  // Allow apigateway to access authorizer
  const cmd2 = `aws lambda add-permission --function-name ${authorizerName} --action lambda:InvokeFunction --statement-id hyperform-statement-${authorizerName} --principal apigateway.amazonaws.com`

  try {
    await exec(cmd2)
    //   console.log(`allowed Lambda ${authorizerName} to be accessed by API gateway`)
  //  console.log(`Authorized Gateway to access ${lambdaName}`)
  } catch (e) {
    // means statement exists already - means API gateway is already auth to access that lambda
    // console.log(`Probably already authorized to access ${lambdaName}`)
    // surpress throw e
    //   console.log(`Lambda ${authorizerName} probably can already be accessed by API gateway`)
  }
  return authorizerArn
}

/**
 * 
 * @param {string} apiId 
 * @param {string} routeKey For example '$default'
 * @returns {string} RouteId of the route
 */
async function getRouteId(apiId, routeKey) {
  const cmd = `aws apigatewayv2 get-routes --api-id ${apiId} --query 'Items[?RouteKey==\`${routeKey}\`]'`

  // aws apigatewayv2 get-routes --api-id 606g79p3j7 --query 'Items[?RouteKey==`$default`]'

  const { stdout } = await exec(cmd, { encoding: 'utf-8' })
  const parsedStdout = JSON.parse(stdout)

  if (parsedStdout.length !== 1) {
    throw new Error(`Could not get route id of apiId, routeKey ${apiId}, ${routeKey}: ${parsedStdout}`)
  }
  const routeId = parsedStdout[0].RouteId
  return routeId
}

/**
 * 
 * @param {string} apiId 
 * @param {string} authorizerArn 
 * @returns {void}
 */
async function setAuthorizer(apiId, authorizerArn) {
  const authorizerName = authorizerArn.split(':').slice(-1)[0]
  const authorizerType = 'REQUEST'
  const identitySource = '$request.header.Authorization'

  const authorizerUri = `arn:aws:apigateway:us-east-2:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-2:735406098573:function:${authorizerName}/invocations`

  // Try to create authorizer for that API
  // succeeds => Authorizer with that name did not exist yet. Use that authorizerId going forward
  // Fails => Authorizer already existed with that name. 
  // Get that one's authorizerId (Follow Hyperform conv: same name - assume identical)

  const cmd = `aws apigatewayv2 create-authorizer --api-id ${apiId} --name ${authorizerName} --authorizer-type ${authorizerType} --identity-source '${identitySource}' --authorizer-uri ${authorizerUri} --authorizer-payload-format-version 2.0 --enable-simple-responses`
  let authorizerId 

  try {
    // Try to create authorizer
    const { stdout } = await exec(cmd, { encoding: 'utf-8' })
    //   console.log(`Newly created Authorizer from Lambda ${authorizerName}`)
    //  console.log(stdout)
    const parsedStdout = JSON.parse(stdout)
    authorizerId = parsedStdout.AuthorizerId
  } catch (e) {
    // authorizer already exists
    // obtain its id
    //   console.log(`Reusing existing authorizer ${authorizerName}`)
    const cmd2 = `aws apigatewayv2 get-authorizers --api-id ${apiId} --query 'Items[?Name==\`${authorizerName}\`]'`
    const { stdout } = await exec(cmd2, { encoding: 'utf-8' })
    const parsedStdout = JSON.parse(stdout)
    authorizerId = parsedStdout[0].AuthorizerId
  }

  const routeKey = '$default'
  // attach authorizer (may be already attached if entered catch but alas)
  const routeId = await getRouteId(apiId, routeKey)
  const cmd3 = `aws apigatewayv2 update-route --api-id ${apiId} --route-id ${routeId} --authorization-type CUSTOM --authorizer-id ${authorizerId} `
  const { stdout } = await exec(cmd3, { encoding: 'utf-8' })
  // console.log(`Attached authorizer to ${routeKey}`)
}

// TODO set authorizer cache ??

module.exports = {
  deployAuthorizer,
  setAuthorizer,
}

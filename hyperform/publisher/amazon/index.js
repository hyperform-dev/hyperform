const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { deployAuthorizer, setAuthorizer } = require('../../authorizer-gen/index')
const { generateRandomBearerToken } = require('../../authorizer-gen/utils')
// TODO handle regional / edge / read up on how edge works
// TODO don't create 
/**
 * * Takes Lambda ARN and makes it public with API gateway
 * @param {string} lambdaArn 
 * @param {{ allowUnauthenticated: boolean }} param1 
 * @returns {{ url: string, token?: string }} url: HTTP endpoint of lambda, token: if allowUnauthenticated is false, the Authentication: Bearer {TOKEN} that will be needed to call the Lambda
 */
async function publishAmazon(lambdaArn, { allowUnauthenticated }) {
  // TODO do we need to publish 1 or N times for every lambda deploy?
  if (allowUnauthenticated == null) {
    throw new Error('PublishAmazon: specify second argument') // TODO HF programmer error, do not check for
  }

  const lambdaName = lambdaArn.split(':').slice(-1)[0]
  const apiName = `hyperform-${lambdaName}`
  
  let apiId 
  let apiUrl

  {
    // Check if API with that name exists
    // Follows Hyperform conv: same name implies identical, for lambdas, and api endpoints etc
    const cmd1 = `aws apigatewayv2 get-apis --query 'Items[?Name==\`${apiName}\`]'`
    const res = await exec(cmd1, { encoding: 'utf-8' })
    const stdout1 = res.stdout 
  
    // TODO one API, and these are routes? pros/cons
    const parsedStdout1 = JSON.parse(stdout1)
  
    if (parsedStdout1.length > 0) {
      // API with that name exists already
      // use that one
      if (parsedStdout1.length !== 1) {
        throw new Error(`Hyperform convention: expect unique API for name ${apiName}, but found: ${parsedStdout1}`)
      }
      
      console.log(`Found api with name ${apiName}, reusing that`)
      apiId = parsedStdout1[0].ApiId 
      apiUrl = parsedStdout1[0].ApiEndpoint
    } else {
      // API with that name does not exist yet
      // create one
      console.log(`No api with name ${apiName}, creating new one`)
      const cmd1 = `aws apigatewayv2 create-api --name ${apiName} --protocol-type HTTP --target ${lambdaArn}`
    
      const res2 = await exec(cmd1, { encoding: 'utf-8' })
      const stdout2 = res2.stdout 
      const parsedStdout2 = JSON.parse(stdout2)
    
      apiUrl = parsedStdout2.ApiEndpoint
      apiId = parsedStdout2.ApiId
    }
  }

  // Add permission to that lambda to be accessed by API gateway
  // nice and easy now and has only to be done 1 (will throw on subsequent)
  // todo iwann spezifisch der api access der lambda erlauben

  {
    const cmd = `aws lambda add-permission --function-name ${lambdaName} --action lambda:InvokeFunction --statement-id hyperform-statement-${lambdaName} --principal apigateway.amazonaws.com`
  
    try {
      await exec(cmd)
    //  console.log(`Authorized Gateway to access ${lambdaName}`)
    } catch (e) {
      // means statement exists already - means API gateway is already auth to access that lambda
      // console.log(`Probably already authorized to access ${lambdaName}`)
      // surpress throw e
    }    
  }
  
  if (allowUnauthenticated === true) {
    // do nothing
    // default is allow unauthenticated
    return {
      url: apiUrl, 
      token: null,
    }
  }
  
  // Deploy Lambda authorizer and set it https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html
  if (allowUnauthenticated === false) {
    const authorizerName = `${lambdaName}-authorizer` // -v0
    // Generate Token that the authorizer will greenlight, and redlight everything else
    const randomBearerToken = generateRandomBearerToken()
    // create authorizer lambda
    const authorizerArn = await deployAuthorizer(authorizerName, randomBearerToken)
    // set authorizer
    await setAuthorizer(apiId, authorizerArn)

    return {
      url: apiUrl,
      token: randomBearerToken,
    }
  }

  throw new Error(`allowUnauthenticated must be true or false but is ${allowUnauthenticated}`)
}

module.exports = {
  publishAmazon,
}

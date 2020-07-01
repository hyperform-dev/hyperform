const { spawn } = require('child_process')
const aws = require('aws-sdk')
const { sharedNamecache } = require('../index')

const lambda = new aws.Lambda({
  region: 'us-east-2',
})

/**
 * @returns {Promise<name>} Promise that if fn found, resolves to it's name, rejects on not found or taking too long
 * @param {*} name 
 */
function amazonQuery(name) {
  console.log(`querying for ${name}`)
  // NOTE don't do elaborate querying, if deployed, ready and so on
  // query is really just if Amazon is the right handler to call for the name
  if (/^arn:(aws|aws-cn|aws-us-gov):lambda:/.test(name) === true) {
    return Promise.resolve(name)
  }

  // consult cache
  const cacheRes = sharedNamecache.get(name)
  if (cacheRes) {
    // safeguard if cache is corrupted
    // Is a programmer mistake, should not be handled
    // if (/^arn:(aws|aws-cn|aws-us-gov):lambda:/.test(name) === false) {
    //   throw new Error("Non-arn found in cache, ")
    // }
    console.log(`Cache resolved ${name}`)
    return Promise.resolve(cacheRes)
  }

  // consult Amazon
  const params = {
    FunctionName: name,
  }

  return (
    lambda.getFunction(params).promise()
      .then((res) => res && res.Configuration && res.Configuration.FunctionArn)
      .then((arn) => {
        sharedNamecache.put(name, arn) // remember this name resolves to this arn for later
        return arn
      })
      .catch((err) => {
        console.log(`Could not get details about Amazon lambda ${name}. Is it deployed?`)
        throw err
      })
  )
}

module.exports = {
  amazonQuery,
}

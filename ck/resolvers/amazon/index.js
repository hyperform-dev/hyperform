const aws = require('aws-sdk')
const { sharedNamecache } = require('../../namecache/index')
const { logdev } = require('../../utils/index')

const lambda = new aws.Lambda({
  region: 'us-east-2',
})

/**
 * @returns {Promise<name>} Promise that if fn found, resolves to it's name, or to null if not found or taking too long
 * @param {*} name 
 */
function amazonQuery(name) {
  console.time(`namequery-${name}`)

  // NOTE don't do elaborate querying, if deployed, ready and so on
  // query is really just if Amazon is the right handler to call for the name
  if (/^arn:(aws|aws-cn|aws-us-gov):lambda:/.test(name) === true) {
    logdev('name: trivial')
    console.timeEnd(`namequery-${name}`)

    return Promise.resolve(name)
  }

  // consult cache
  const cacheRes = sharedNamecache.get(name)
  if (cacheRes) {
    logdev('name: cached')
    console.timeEnd(`namequery-${name}`)

    // safeguard if cache is corrupted
    // NOTE:  Is a programmer mistake, should not be handled
    // if (/^arn:(aws|aws-cn|aws-us-gov):lambda:/.test(name) === false) {
    //   throw new Error("Non-arn found in cache, ")
    // }
    return Promise.resolve(cacheRes)
  }

  // consult Amazon
  const params = {
    FunctionName: name,
  }

  logdev('name: asked amazon')

  return (
    lambda.getFunction(params).promise()
      .then((res) => res && res.Configuration && res.Configuration.FunctionArn)
      .then((arn) => {
        sharedNamecache.put(name, arn) // remember this name resolves to this arn for later
        console.timeEnd(`namequery-${name}`)
        return arn
      })
      .catch(() => null) // if not found on amazon, no big deal, just return something falsy
  ) 
}

module.exports = {
  amazonQuery,
}

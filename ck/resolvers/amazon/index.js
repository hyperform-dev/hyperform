const aws = require('aws-sdk')
const { sharedNamecache } = require('../../namecache/index')

const lambda = new aws.Lambda({
  region: 'us-east-2',
})

/**
 * @returns {Promise<name>} Promise that if fn found, resolves to it's name, or to null if not found or taking too long
 * @param {*} name 
 */
function amazonQuery(name) {
  console.time(`namequery-${name}`)

  // console.log(`querying for ${name}`)
  // NOTE don't do elaborate querying, if deployed, ready and so on
  // query is really just if Amazon is the right handler to call for the name
  if (/^arn:(aws|aws-cn|aws-us-gov):lambda:/.test(name) === true) {
    console.log('name: trivial')
    console.timeEnd(`namequery-${name}`)

    return Promise.resolve(name)
  }

  // consult cache
  const cacheRes = sharedNamecache.get(name)
  if (cacheRes) {
    console.log('name: cached')
    console.timeEnd(`namequery-${name}`)

    // safeguard if cache is corrupted
    // Is a programmer mistake, should not be handled
    // if (/^arn:(aws|aws-cn|aws-us-gov):lambda:/.test(name) === false) {
    //   throw new Error("Non-arn found in cache, ")
    // }
    //  console.log(`Cache resolved ${name}`)
    return Promise.resolve(cacheRes)
  }

  // consult Amazon
  const params = {
    FunctionName: name,
  }

  console.log('name: asked amazon')

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

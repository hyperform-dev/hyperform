const { spawn } = require('child_process')
const aws = require('aws-sdk')

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

  const params = {
    FunctionName: name,
  }

  return (
    lambda.getFunction(params).promise()
      .then((res) => res && res.Configuration && res.Configuration.FunctionName)
      .catch((err) => {
        console.log(`Could not get details about Amazon lambda ${name}. Is it deployed?`)
        throw err
      })
  )
}

module.exports = {
  amazonQuery,
}

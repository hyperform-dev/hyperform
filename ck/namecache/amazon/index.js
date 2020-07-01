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

  return new Promise((resolve, reject) => {
    const params = {
      FunctionName: name,
    }

    lambda.getFunction(params, (err, data) => {
      if (err) {
        console.log(err, err.stack); 
        reject(err)
      } 

      // console.log(data)
      const arn = data.Configuration.FunctionArn
      resolve(arn)
    })
  })
}

module.exports = {
  amazonQuery,
}

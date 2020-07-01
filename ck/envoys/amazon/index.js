const aws = require('aws-sdk')
const { amazonQuery } = require('../../namecache/amazon/index')
const { amazonLog } = require('../../loggers/amazon/index')

// aws.config.logger = console
// TODO not only one region; do name resolving at the start, not here
const lambda = new aws.Lambda({
  region: 'us-east-2',
})

// Envoys should resolve to output obj if successful, or throw an error if not
const amazonEnvoy = {
  canEnvoy: function (name) {
    return (
      amazonQuery(name)
        .then(() => true)
        .catch(() => false)
    )
  },
  envoy: function (name, input) {
    const jsonInput = JSON.stringify(input)
    return (
      lambda.invoke({
        FunctionName: name,
        Payload: jsonInput,
        LogType: 'Tail',
      })
        .promise()
        .then((res) => {
          // Log Lambda's stdout in local terminal
          amazonLog(res)
          return res
        })
        .then((p) => p.Payload)
        .then((p) => JSON.parse(p))
        .then((p) => {
          if (p && p.errorType && p.errorType === 'Error') {
            throw new Error(p.errorMessage)
          }
          return p
        })
    )
  },
}

module.exports = {
  amazonEnvoy,
}

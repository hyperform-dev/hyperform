const aws = require('aws-sdk')
const { amazonQuery } = require('../../resolvers/amazon/index')
const { amazonLog } = require('../../loggers/amazon/index')

// aws.config.logger = console
// TODO not only one region; do name resolving at the start, not here
const lambda = new aws.Lambda({
  region: 'us-east-2',
})

// Envoys should resolve to output obj if successful, or throw an error if not
const amazonEnvoy = {
  // TODO not call it locally here, use namecache
  canEnvoy: function (name) {
    return (
      amazonQuery(name)
        .then((res) => !!res) // amazonQuery returned something
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
        // 1) Check if function succeeded
        .then((p) => {
          if (p && p.FunctionError) {
            throw new Error(`Function ${name} failed: ${p.Payload}`)
          }
          return p
        })
        // 2) If yes, log Lambda's stdout in local terminal
        .then((res) => {
          // remove arn:... part
          const prettyname = name.split(':').slice(-1)[0]
          amazonLog(res, prettyname)
          return res
        })
        // TODO do multiple parses if it was stringified multiple times lol
        // TODO or check that its an object after 1 go, otherwise throw / complain to user
        // 3) Parse its return value
        .then((p) => p.Payload)
        .then((p) => JSON.parse(p))
    )
  },
}

module.exports = {
  amazonEnvoy,
}

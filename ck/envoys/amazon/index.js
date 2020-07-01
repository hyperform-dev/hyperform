const aws = require('aws-sdk')
// reuse TCP HTTPS connection to amazon
const https = require('https');

const agent = new https.Agent({
  keepAlive: true, 
  // Infinitity is read as 50 sockets
  maxSockets: Infinity,
  
});

aws.config.update({
  maxRetries: 2,
  httpOptions: {
    agent: agent,
    // set timeout to 15.1 minutes (6s above lambda max)
    timeout: 15.1 * 60 * 1000,
  },
});

const { amazonQuery } = require('../../resolvers/amazon/index')
const { amazonLog } = require('../../loggers/amazon/index')

// aws.config.logger = console
// TODO not only one region; do name resolving at the start, not here
const lambda = new aws.Lambda({
  region: 'us-east-2',
})

// TODO handle timeouts. currently it's stuck when function exceeds its timeout

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

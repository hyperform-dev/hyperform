/* eslint-disable arrow-body-style */

const aws = require('aws-sdk')
// reuse TCP HTTPS connection to amazon
const https = require('https');
// at some point, tweak these
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
const { extractRegion } = require('../../topology/helpers/index')
const { regions } = require('../../topology/index')

// Creating lambda is insanely fast
// lambda: 0.385ms
// lambda: 0.339ms
// lambda: 0.383ms
// Just do that every envoy to reduce complexity

// Envoys should resolve to output obj if successful, or throw an error if not
const amazonEnvoy = {
  canEnvoy: function (name) {
    return (
      /^arn:(aws|aws-cn|aws-us-gov):lambda:/.test(name) === true
    )
  },
  envoy: async function (arn, input) {
    const region = extractRegion(arn)
    const lambda = new aws.Lambda({ region })
    const jsonInput = JSON.stringify(input)
    const uid = `${Math.ceil(Math.random() * 1000)}`
    console.time(`envoy ${uid}`)
    return (
      lambda.invoke({
        FunctionName: arn,
        Payload: jsonInput,
        LogType: 'Tail',
      })
        .promise()
        // 1) Check if function succeeded
        .then((p) => {
          if (p && p.FunctionError) {
            throw new Error(`Function ${arn} failed: ${p.Payload}`)
          }
          console.timeEnd(`envoy ${uid}`)

          return p
        })
        // TODO maybe reinstantiate
        // 2) If yes, log Lambda's stdout in local terminal
        // .then((res) => {
        //   // // remove arn:... part
        //   // const prettyname = `${arn.split(':').slice(-1)[0]} (Amazon)`
        //   // amazonLog(res, prettyname)
        //   // return res
        // })
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

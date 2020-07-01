const aws = require('aws-sdk')

const lambda = new aws.Lambda({
  region: 'us-east-2',
})

// Envoys should resolve to output obj if successful, or throw an error if not
const amazonEnvoy = {
  canEnvoy: function (name) {
    return /^arn:(aws|aws-cn|aws-us-gov):lambda:/.test(name)
  },
  envoy: function (name, input) {
    const jsonInput = JSON.stringify(input)
    return (
      lambda.invoke({
        FunctionName: name,
        Payload: jsonInput,
      })
        .promise()
        .then((p) => p.Payload)
        .then((p) => JSON.parse(p))
        .then((p) => {
          if (p.errorType && p.errorType === 'Error') {
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

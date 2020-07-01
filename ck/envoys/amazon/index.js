const aws = require('aws-sdk')

const lambda = new aws.Lambda({
  region: 'us-east-2',
})

const amazonEnvoy = {
  canEnvoy: function (name) {
    return /^arn:(aws|aws-cn|aws-us-gov):lambda:/.test(name)
  },
  envoy: function (name, input) {
    console.log(`Using Amazon envoy for ${name}`)
    const jsonInput = JSON.stringify(input)
    return (
      lambda.invoke({
        FunctionName: name,
        Payload: jsonInput,
      })
        .promise()
        .then((p) => p.Payload)
        .then((p) => JSON.parse(p))
    )
  },
}

module.exports = {
  amazonEnvoy,
}

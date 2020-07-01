const aws = require('aws-sdk')

const lambda = new aws.Lambda({
  region: 'us-east-2',
})

const amazonEnvoy = {
  canEnvoy: function (name) {
    return /^arn:(aws|aws-cn|aws-us-gov):lambda:/.test(name)
  },
  envoy: function (name, input) {
    let jsonInput
    try {
      json = JSON.stringify(input)
    } catch (e) {
      console.log(`Could not JSON stringify function input: ${input}`)
    }

    return (
      lambda.invoke({
        FunctionName: name,
        Payload: JSON.stringify(input),
      })
        .promise()
        .then((p) => p.Payload)
    )
  },
}

module.exports = {
  amazonEnvoy,
}

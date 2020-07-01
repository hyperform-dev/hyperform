const aws = require('aws-sdk')
const uuidv4 = require('uuid').v4

/**
 * @description This serverless function gathers responses sent 
 * by users answering $ hyperform survey
 */

async function endpoint_collectSurveyResponse(event) {
  const s3 = new aws.S3()
  const filename = `${new Date().toDateString()}:${uuidv4()}.json`

  if (event == null || Object.keys(event).length === 0) {
    return
  }
  const putParams = {
    Bucket: 'hyperform-survey-responses',
    Key: `cli-responses/${filename}`,
    Body: JSON.stringify(event, null, 2),
  }
  await s3.putObject(putParams).promise()
}

module.exports = {
  endpoint_collectSurveyResponse,
}

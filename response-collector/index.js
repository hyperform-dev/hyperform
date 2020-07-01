const aws = require('aws-sdk')
const uuidv4 = require('uuid').v4

/**
 * @description This serverless function gathers responses sent 
 * by users answering $ hyperform survey
 */

async function collectSurveyResponse(event) {
  const s3 = new aws.S3()
  const filename = `${new Date().toDateString()}:${uuidv4()}.json`

  if (event == null) return 
  
  const putParams = {
    Bucket: 'hyperform-survey-responses',
    Key: `cli-responses/${filename}`,
    Body: JSON.stringify(event, null, 2),
  }
  await s3.putObject(putParams).promise()
}

function getSurveyQuestion() {
  return {
    text: 'Some survey text',
    postUrl: 'https://mj9jbzlpxi.execute-api.us-east-2.amazonaws.com',
  }
}

module.exports = {
  endpoint_getSurveyQuestion: getSurveyQuestion,
  endpoint_collectSurveyResponse: collectSurveyResponse,
}

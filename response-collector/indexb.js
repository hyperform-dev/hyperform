// In separate files because Google does not have 'aws-sdk', 
// and throws on function staging (while deploying)

// Actually.. no good reason to keep them in separate files
// That will be sth to solve either way

async function endpoint_getSurveyQuestion(event) {
  return {
    // TODO 
    text: 'Some survey text',
    postUrl: 'https://mj9jbzlpxi.execute-api.us-east-2.amazonaws.com', // collect survey response endpoint
    // should not need bearer token
  }
}

module.exports = {
  endpoint_getSurveyQuestion,
}

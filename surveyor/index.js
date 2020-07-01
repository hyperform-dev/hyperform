const fetch = require('node-fetch')

// 0 to 1, with which to show survey
const probability = 0.04

const getSurveyUrl = 'https://era1vrrco0.execute-api.us-east-2.amazonaws.com'
const postSurveyAnswerUrl = 'https://mj9jbzlpxi.execute-api.us-east-2.amazonaws.com'

function maybeShowSurvey() {
  if ((new Date().getSeconds() / 60) < probability) {
    fetch(getSurveyUrl)
      .then((res) => res.json())
      .then((res) => console.log(`

  ${res.text}
  You can type $ hf answer ... to answer :)
  `))
  }
}

async function answerSurvey(text) {
  const currentSurvey = await fetch(getSurveyUrl)
    .then((res) => res.json())
  
  await fetch(postSurveyAnswerUrl, {
    method: 'POST',
    body: JSON.stringify({
      currentSurvey: currentSurvey,
      answer: text,
      date: new Date(),
    }),
  })
}

module.exports = {
  maybeShowSurvey,
  answerSurvey,
}

const { amazonEnvoy } = require('./amazon/index')
const { firstOf } = require('../utils/index')
// will pick the one that says canEnvoy() = true the fastest
const envoys = [
  amazonEnvoy,
]

/**
 * @param {*} name 
 * @param {*} input 
 */
async function envoy(name, input) {
  // start all canQuery in parallel
  // TODO wait for first one to canEnvoy() = true
  // wait for all to answer, pick the first one in the array (not performant)
  const canEnvoyProms = envoys.map((evy) => evy.canEnvoy(name))
  const canEnvoyAnswers = await Promise.all(canEnvoyProms)

  if (canEnvoyAnswers.includes(true) === false) {
    throw new Error(`No envoy found for ${name}`)
  }

  // indexOf of the first one that canEnvoy
  const selectedenvoy = envoys[canEnvoyAnswers.indexOf(true)]
  console.log('Selected envoy index: ', canEnvoyAnswers.indexOf(true))
  // USE THAT ENVOY TO CALL CLOUD FN
  const response = await selectedenvoy.envoy(name, input)
  // return its output
  return response
}

module.exports = {
  envoy,
}

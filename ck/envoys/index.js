const uuidv4 = require('uuid').v4 
const { amazonEnvoy } = require('./amazon/index')

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

  const selectedenvoy = envoys[canEnvoyAnswers.indexOf(true)]
  // Call cloud fn
  const uid = uuidv4()
  console.time(`envoy-${uid}`)
  const response = await selectedenvoy.envoy(name, input)
  console.timeEnd(`envoy-${uid}`)

  return response
}

module.exports = {
  envoy,
}

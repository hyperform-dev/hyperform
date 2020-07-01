const uuidv4 = require('uuid').v4 
const { amazonEnvoy } = require('./amazon/index')
const { spinnies } = require('../printers/index')
const { validateOutput } = require('../utils/index')

const envoys = [
  amazonEnvoy,
]

/**
 * @param {*} name 
 * @param {*} input 
 */
async function envoy(name, input) {
  // select envoy who handles that name
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
  
  spinnies.add(uid, { text: name })

  let response 
  try {
    // ENVOY
    response = await selectedenvoy.envoy(name, input)
    spinnies.succeed(uid, { text: name })
  } catch (e) {
    spinnies.fail(uid, { text: name })
    throw e
  }
  console.timeEnd(`envoy-${uid}`)

  // Ensure it's an object, etc...
  validateOutput(response, name)

  return response
}

module.exports = {
  envoy,
}

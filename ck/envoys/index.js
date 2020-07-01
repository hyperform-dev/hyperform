const uuidv4 = require('uuid').v4 
const { amazonEnvoy } = require('./amazon/index')
const { spinnies } = require('../printers/index')
const { validateOutput } = require('../utils/index')
const { resolveName } = require('../resolvers/index')

const envoys = [
  amazonEnvoy,
]

/**
 * @param {*} name 
 * @param {*} input 
 */
async function envoy(name, input) { 
  // resolve to uri (specific provider...)
  // also writes it to namecache for further use
  const uri = await resolveName(name)
  // find right envoy for uri format (ARN,...)
  const canEnvoyAnswers = envoys.map((evy) => evy.canEnvoy(uri))

  if (canEnvoyAnswers.includes(true) === false) {
    throw new Error(`No envoy found for ${uri}`)
  }

  // pick first one
  const selectedenvoy = envoys[canEnvoyAnswers.indexOf(true)]
  // Call cloud fn
  const uid = uuidv4()
  console.time(`envoy-${uid}`)
  
  spinnies.add(uid, { text: uri })

  let response 
  try {
    // ENVOY
    response = await selectedenvoy.envoy(uri, input)
    spinnies.remove(uid, { text: uri })
  } catch (e) {
    spinnies.fail(uid, { text: uri })
    throw e
  }
  console.timeEnd(`envoy-${uid}`)

  // Ensure it's an object, etc...
  validateOutput(response, uri)

  return response
}

module.exports = {
  envoy,
}

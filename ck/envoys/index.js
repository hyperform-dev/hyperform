const uuidv4 = require('uuid').v4 
const { amazonEnvoy } = require('./amazon/index')
const { spinnies } = require('../printers/index')
const { validateOutput } = require('../utils/index')
const { resolveName } = require('../resolvers/index')
const { log } = require('../utils/index')

const envoys = [
  amazonEnvoy,
]

// adds or increases spinnie
function addEnvoySpinnie(name) {
  try {
    const reusableSpinnie = spinnies.pick(name)
    // no spinnie reusable
    // => "arn:aws:myfunc"
    if (reusableSpinnie == null) {
      spinnies.add(name, { text: name })
    } else {
      // spinnie reusable
      // "arn:aws:myfunc => 2x arn:aws:myfunc"
      const currN = +reusableSpinnie.text.match(/^[0-9]*/)[0] || 0
      const newN = currN + 1 
      const newText = `${newN}× ${name}`
      spinnies.update(name, { text: newText })
    }
  } catch (e) {
    log(`Failed to increase spinner for ${name}, someone probably removed it in the meantime`)
  }
}

// decreases or removes spinnie
function removeEnvoySpinnie(name) {
  try {
    const reusableSpinnie = spinnies.pick(name)
    if (reusableSpinnie == null) {
      return // was already removed
    }
    const currN = +reusableSpinnie.text.match(/^[0-9]*/)[0] || 0
     
    if (currN <= 1) {
      spinnies.remove(name)
    } else {
      // decrease 
      const newN = currN - 1
      const newText = `${newN}× ${name}`
      spinnies.update(name, { text: newText })
    }
  } catch (e) {
    log(`Failed to remove spinner for ${name}, someone probably removed it in the meantime`)
  }
}

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
  
  // reuse spinner if it exists for fn (just add a +1)
  addEnvoySpinnie(name)

  let response 
  try {
    // ENVOY
    response = await selectedenvoy.envoy(uri, input)
    removeEnvoySpinnie(name)
  } catch (e) {
    spinnies.fail(uri, { text: uri })
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

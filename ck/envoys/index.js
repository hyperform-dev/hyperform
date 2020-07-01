const { amazonEnvoy } = require('./amazon/index')

// order is important
// will pick the first one that canEnvoy, to envoy.
const envoys = [
  amazonEnvoy,
]

/**
 * @param {*} name 
 * @param {*} input 
 */
function envoy(name, input) {
  for (let i = 0; i < envoys.length; i += 1) {
    const en = envoys[i]
    if (en.canEnvoy(name)) { 
      return en.envoy(name, input)
    }
  }
  throw new Error(`No envoy found for ${name}`)
}

module.exports = {
  envoy,
}

const { amazonEnvoy } = require('./amazon/index')

async function envoy(name, input) {
  return amazonEnvoy.envoy(name, input)
}

module.exports = {
  envoy,
}

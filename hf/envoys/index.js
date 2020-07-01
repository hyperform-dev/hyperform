const { scout } = require('../____scouts/amazon/index')
const { amazonEnvoy } = require('./amazon/index')
const { sharedNamecache } = require('../namecache/index')

async function envoy(name, input) {
  console.time('scout')
  await scout()

  console.log(sharedNamecache)
  console.timeEnd('scout')
  const arn = sharedNamecache.get(name)
  if (arn == null) {
    throw new Error(`Could not find ${name} in namecache after scouting`)
  }
  // we only have amazon
  return amazonEnvoy.envoy(arn, input)
}

module.exports = {
  envoy,
}

envoy('myincinc', { num: 2 }).then(console.log)

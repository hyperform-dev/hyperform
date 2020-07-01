const { amazonQuery } = require('./amazon/index')
const { logdev } = require('../utils/index')
// order matters
// we'll blindly pick the first platform that has that fn
const resolvers = [
  amazonQuery,
]

async function resolveName(name) {
  // they will each first look if it's trivial for them (ARN), 
  // then look at the cache
  // and then consult with Amazon, ...
  const resolveAnswers = await Promise.all(resolvers.map((resv) => resv(name)))

  for (let i = 0; i < resolveAnswers.length; i += 1) {
    if (resolveAnswers[i]) {
      logdev(`resolved ${name} ===> ${resolveAnswers[i]}`)
      return resolveAnswers[i]
    }
  }

  throw new Error(`Could not resolve  name "${name}" to any platform`)
}

module.exports = {
  resolveName,
}

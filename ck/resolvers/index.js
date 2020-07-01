const { amazonQuery } = require('./amazon/index')
const { logdev } = require('../utils/index')
// order matters
// we'll blindly pick the first platform that has that fn
const resolvers = [
  amazonQuery,
]

/** 
 * (1) look if it's trivial (ARN, ...)
 * (2) consult cache, wait if necessary 
 * (3) ask providers if they have it, if multiple have it choose leftmost of [Amazon, ]
*/
/**
 * 
 * @param {*} name 
 * @param {*} namecache 
 */
async function resolveName(name, namecache) {
  // if it or promise of it is in the namecache, just return that
  const namecacheEntry = namecache.get(name)
  if (namecacheEntry != null) {
    const res = await namecacheEntry // await to extract promise value
    logdev(`resolved ${name}: cached`)
    return res
  }
  logdev(`not cached ${name}, gotta ask`)
  // TODO 
  // NAMECACHE JUST STORES PROMISES OR STRINGS
  // BEFORE ENVOY, RESOLVE NAME TO SOME URI
  // CANENVOY IS JUST A REGEX
  // ((IF ENVOY FAILS, UNSET NAMECACHE ENTRY)

  // don't get confused by "promisy"-resolve and "namey"-resolve, different things

  // write promise directly into namecache that will resolve itself
  // that way, other resolving the same name will wait for that (reuse its result)
  // ... instead of asking Amazon in the meantime themselves
 
  const prom = new Promise((resolve, reject) => {
    // very inefficient because it consults platforms even if one claimed resp already
    // NOTE but necessary if order matters
    Promise.all(resolvers.map((resv) => resv(name, namecache))) 
      .then((resolveAnswers) => {
        for (let i = 0; i < resolveAnswers.length; i += 1) {
          if (resolveAnswers[i]) {
            logdev(`resolved (asked providers) ${name} ===> ${resolveAnswers[i]}`)
            resolve(resolveAnswers[i])
          }
        }
        reject(new Error(`Could not resolve  name "${name}" to any platform`))
      })
  })

  namecache.put(
    name,
    prom,
  )
  // wait for it
  const resolvedname = await prom 
  return resolvedname
}

module.exports = {
  resolveName,
}

// scouting starts as soon as this file is loaded
const { regions, roundtripCost } = require('../../topology/index')
const { sharedNamecache } = require('../../namecache/index')
const { sharedLambdas } = require('../../connections/amazon/index')

const CURRREGION = 'us-east-2'

/**
 * Scouts all regions for function names and updates namecache accordingly
 * if no entry, or it's cheaper than current entry
 */
async function scout() {
  // for each region, 
  return Promise.all(
    regions.map(async (region) => {
      const lambda = sharedLambdas[region]

      const params = {
        MaxItems: 999,
      }

      const res = await lambda.listFunctions(params).promise()
      if (res == null || res.Functions == null) {
        return
      }

      const fns = res.Functions 
      fns.forEach((fn) => {
        const arn = fn.FunctionArn 
        const name = fn.FunctionName 
        const currcacheentry = sharedNamecache.get(name)
        
        // if cache doesnt have it, set it 
        if (currcacheentry == null) {
          sharedNamecache.put(name, arn)
        } 
        // if cache has it, compare costs
        else {
          const currcacheentrycost = roundtripCost(CURRREGION, currcacheentry)
          const thiscost = roundtripCost(CURRREGION, arn)
          if (thiscost < currcacheentrycost) {
            sharedNamecache.put(name, arn)
          }
        }
      })
    }),
  )
}

module.expoorts = {
  scout,
}

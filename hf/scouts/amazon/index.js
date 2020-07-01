/* eslint-disable arrow-body-style */
const aws = require('aws-sdk')
const { regions, roundtripCost } = require('../../topology/index')
const { sharedNamecache } = require('../../namecache/index')

const CURRREGION = 'us-east-2'

/**
 * Scouts all regions for function names and updates namecache accordingly
 * if no entry, or it's cheaper than current entry
 */
let isScouted = false 

async function scout() {
  // only scout once
  if (isScouted === true) return Promise.resolve()
  // for each region, 
  const all = await Promise.all(
    regions.map(async (region) => {
      const lambda = new aws.Lambda({ region })

      const params = {
        MaxItems: 999,
      }
      // TODO solve better with pagination
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
  isScouted = true 
  return all
}

// distance to region should be natural penalty / delay
// closer regions will list names faster
// hence will be picked more often

module.exports = {
  scout,
}

/* eslint-disable no-multi-spaces, array-bracket-spacing */

// Later, generate/update this automatically
// Kind of a constants file, not really 

const { extractRegion } = require('./extractors/index')

const regionsToIdx = {
  'amazon/us-east-1': 0,
  'amazon/us-east-2': 1,
}

const topology = [

  [0,    100  ],
  [100,  0 ],

]

/**
 * 
 * @param {string} from provider + / + region (eg amazon/us-east-2)
 * @param {string} to provider + / + region (eg amazon/us-east-2)
 */
function getCost(from, to) {
  // convert arn etc... to `provider/region`
  const fromKey = extractRegion(from) 
  const toKey = extractRegion(to)

  const fromIdx = regionsToIdx[fromKey]
  const toIdx = regionsToIdx[toKey]

  if (fromIdx == null) throw new Error(`getCost: do not know region ${from} (from)`)
  if (toIdx == null) throw new Error(`getCost: do not know region ${to} (to)`)

  const cost = topology[fromIdx][toIdx]

  return cost
}

module.exports = {
  getCost,
  __only_for_testing_topology: topology,
  __only_for_testing_regionsToIdx: regionsToIdx,
  regionsToIdx,
}

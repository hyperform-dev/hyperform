/* eslint-disable no-multi-spaces, array-bracket-spacing */

// Later, generate/update this automatically
// Kind of a constants file, not really 

const { extractRegion } = require('./extractors/index')

const regionsToIdx = {
  'us-east-1': 0,
  'us-east-2': 1,
}

const topology = [

  [0,    100  ],
  [100,  0 ],

]

const regions = Object.keys(regionsToIdx)

/**
 * 
 * @param {string} from arn
 * @param {string} to arn
 */
function getCost(from, to) {
  // convert arn  to region
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
  regions,
  __only_for_testing_topology: topology,
  __only_for_testing_regionsToIdx: regionsToIdx,
  regionsToIdx,
}

/* eslint-disable no-multi-spaces, array-bracket-spacing */

const { extractRegion } = require('./helpers/index')
// Later, generate/update this automatically
// Kind of a constants file, not really 

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
 * @param {string} from arn or region
 * @param {string} to arn or region
 */
function roundtripCost(from, to) {
  // convert arn  to region
  const fromRegion = extractRegion(from) 
  const toRegion = extractRegion(to)

  const fromIdx = regionsToIdx[fromRegion]
  const toIdx = regionsToIdx[toRegion]

  if (fromIdx == null) throw new Error(`getCost: do not know region of ${from} (from)`)
  if (toIdx == null) throw new Error(`getCost: do not know region of ${to} (to)`)

  const cost = topology[fromIdx][toIdx]

  return cost
}

module.exports = {
  roundtripCost,
  regions,
  __only_for_testing_topology: topology,
  __only_for_testing_regionsToIdx: regionsToIdx,
}

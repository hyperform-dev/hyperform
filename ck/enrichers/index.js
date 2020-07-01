const uuidv4 = require('uuid').v4
const { unenrichedschemas } = require('../schemas/index')

const flowJsonEnrichers = {
  sequence: {
    canEnrich: (obj) => {
      const schema = unenrichedschemas.sequence
      const { error } = schema.validate(obj)
      return !error
    },
    enrich: (arr) => {
      const newarr = [...arr]
      // Id fields
      for (let i = 0; i < newarr.length; i += 1) {
        if (!newarr[i].id) {
          newarr[i].id = `${newarr[i].run}-${uuidv4()}`
        }
      }

      // In fields
      // assumes it's only atomic fns
      newarr[0].in = '__workflow_in'
      for (let i = 1; i < newarr.length; i += 1) {
        if (newarr[i].in == null) {
          newarr[i].in = newarr[i - 1].id
        }
      }

      return newarr
    },
  },
}

function detectnodetype(obj) {
  for (const [nodetype, v] of Object.entries(flowJsonEnrichers)) {
    if (v.canEnrich(obj) === true) {
      return nodetype
    }
  }
  throw new Error(`No enricher claimed responsibility (canEnrich) for ${obj}`)
}

/**
 * Takes any type of node, and recursively enriches it
 * @param {*} obj 
 * @returns {Promise<*>}
 */
function enrich(obj) {
  const nodetype = detectnodetype(obj)
  return flowJsonEnrichers[nodetype].enrich(obj)
}

module.exports = {
  enrich,
}

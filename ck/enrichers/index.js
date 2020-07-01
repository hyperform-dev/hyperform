const uuidv4 = require('uuid').v4
const { unenrichedschemas } = require('../schemas/unenriched/index')

// NOTE THE SLIGHTLY DIFFERENT SEMANTICS TO NODEBUILDERS!
// Especially enrich's return values

const flowJsonEnrichers = {
  atomic: {
    canEnrich: (obj) => {
      const schema = unenrichedschemas.flat_atomic
      const { error } = schema.validate(obj)
      return !error
    },
    /**
     * @returns {[enriched, outputkey]} key the output of that construct will be saved under
     */
    enrich: (obj, env) => {
      const newobj = { ...obj }
      newobj.in = env.in

      return [newobj, newobj.run]
    },
  },
  sequence: {
    canEnrich: (obj) => {
      // TODO too overeager since sequence is any arrray?
      const schema = unenrichedschemas.flat_sequence
      const { error } = schema.validate(obj)
      return !error
    },
    enrich: (arr, env) => {
      const newarr = [...arr]

      if (!newarr.length) {
        return [newarr, null] // TODO convention: use null as void  do that everywhere
      }

      // first member receives sequence's in
      const [fstMemberEnriched, fstMemberOutputkey] = enrich(newarr[0], { in: env.in })
      newarr[0] = fstMemberEnriched 

      let outputKey = fstMemberOutputkey
      let enriched
      // chain functions, by setting each "in" to the predecessor's outputkey
      for (let i = 1; i < newarr.length; i += 1) {
        // enrich member
        const res = enrich(newarr[i], { in: outputKey });
        // remember outputkey for next member's in
        [newarr[i], outputKey] = res
      }
      
      return [newarr, outputKey]
    },
  },
  doParallel: {
    canEnrich: (obj) => {
      const schema = unenrichedschemas.flat_doParallel
      const { error } = schema.validate(obj)
      return !error
    },
    enrich: (obj, env) => {
      if (!obj.doParallel.length) {
        return [obj, null]
      }

      const newobj = { ...obj }
      let outputKey 
      //  they all receive the same input
      const _res = newobj.doParallel.map((sec) => enrich(sec, { in: env.in }))
      const enrichedSections = _res.map((r) => r[0])
      const outputKeys = _res.map((r) => r[1])

      newobj.doParallel = enrichedSections
      // TODO support nested outputkeys (here it's necessary,
      //  it's parallel so we want each section's output)
      return [newobj, outputKeys]
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
 * @param {{in: string}} env Optional info for enriching this object
 * @returns {[enriched: Object, outputKey: string]}
 */
function enrich(obj, env) {
  const nodetype = detectnodetype(obj)
  return flowJsonEnrichers[nodetype].enrich(obj, env)
}

module.exports = {
  enrich,
}

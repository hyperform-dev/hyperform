const uuidv4 = require('uuid').v4
const { enrichedschemas } = require('../schemas/index')

const enrichers = {
  'flow.json': (obj) => {
    function enrichSequence(arr, inName) {
      const enrichedarr = [...arr]

      // ADD ID FIELDS
      for (let i = 0; i < enrichedarr.length; i += 1) {
        // don't overwrite if user set it manually (overwrite if empty string)
        if (!enrichedarr[i].id) { 
          enrichedarr[i].id = `${enrichedarr[i].run}-${uuidv4()}`
        }
      }
        
      // ADD IN FIELDS
      for (let i = 0; i < enrichedarr.length; i += 1) {
        if (i === 0) { 
          // first function's in = sequence's in
          enrichedarr[i].in = inName
          continue 
        }
        // function in
        // fn input is previous fn's output (identified by run field)
        // TODO introduce wf-unique id's
        // TODO warn if 'in' is invalid or appears nowhere
        // don't overwrite if user set it manually (do not overwrite if empty string ~ void)
        if (enrichedarr[i].in == null) { 
          enrichedarr[i].in = enrichedarr[i - 1].id
        }
      }

      return enrichedarr
    }

    // only support sequence
    return enrichSequence(obj, '__workflow_in')
  },
}

const enrichedvalidators = {
  'flow.json': (obj) => {
    // here after enriching, "in" is not mandatory
    const schema = enrichedschemas.sequence

    const { error, value } = schema.validate(obj)
    if (error) {
      throw new Error(`${error} ${value}`)
    }
  },
}

/**
 * 
 * @param {{presetName: string, obj: Object}} options 
 */
async function enrichvalidate(options) {
  // force us to implement both or neither
  if ((enrichers[options.presetName] && !enrichedvalidators[options.presetName]) 
  || (!enrichers[options.presetName] && enrichedvalidators[options.presetName])) {
    throw new Error(`UNIMEPLEMENTED: implement either none or both of enricher, validator for: ${options.presetName}`)
  }
  
  // enriching is optional, if there's no preset just return unchanged
  if (!enrichers[options.presetName]) {
    return options.obj
  }

  // enrich it
  const result = await enrichers[options.presetName](options.obj)
  // validate it again
  await enrichedvalidators[options.presetName](result)
 
  return result
}

module.exports = {
  enrichvalidate,
}

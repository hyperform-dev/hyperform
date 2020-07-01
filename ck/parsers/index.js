const fs = require('fs')
const joi = require('joi')
const fsp = require('fs').promises
const uuidv4 = require('uuid').v4 

const readers = {
  'flow.json': (path) => {
    if (fs.existsSync(path) === false) {
      throw new Error('No flow.json found in this directory')
    }
    return fsp.readFile(path, { encoding: 'utf8' })
  },
}

const parsers = {
  'flow.json': (contents) => {
    const parsedJson = JSON.parse(contents)
    return parsedJson
  },
}

const firstvalidators = {
  'flow.json': (obj) => {
    const schema = joi.array().items(
      joi.object({
        run: joi.string().required(),
        in: joi.string(),
      }),
    )

    const { error, value } = schema.validate(obj)
    if (error) {
      throw new Error(`${error} ${value}`)
    }
  },
}

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

const secondvalidators = {
  'flow.json': (obj) => {
    // here after enriching, "in" is not mandatory
    const schema = joi.array().items(
      joi.object({
        run: joi.string().required(),
        in: joi.string().required(),
        id: joi.string().required(),
      }),
    )

    const { error, value } = schema.validate(obj)
    if (error) {
      throw new Error(`${error} ${value}`)
    }
  },
}

/**
 * 
 * @param {{presetName: string, path: string}} options 
 */
async function readparsevalidate(options) {
  if (!readers[options.presetName]) {
    throw new Error(`UNIMEPLEMENTED: reader for ${options.presetName}`)
  }
  if (!parsers[options.presetName]) {
    throw new Error(`UNIMEPLEMENTED: reader for ${options.presetName}`)
  }
  if (!firstvalidators[options.presetName]) {
    throw new Error(`UNIMEPLEMENTED: reader for ${options.presetName}`)
  }

  if (!options.presetName || !options.path) {
    throw new Error('DEV: readparsevalidate: specify presetName and path')
  }

  let result

  // read it
  result = await readers[options.presetName](options.path)
  // parse it
  result = await parsers[options.presetName](result)
  // first validate it
  await firstvalidators[options.presetName](result)

  // enriching and second validation is optional step

  // force us if we do one, do both
  if ((!enrichers[options.presetName] && firstvalidators[options.presetName])
   || (enrichers[options.presetName] && !firstvalidators[options.presetName])) {
    throw new Error(`UNIMPLEMENTED: you need to implement both or neither of enricher and secondvalidate for: ${options.presetName}`)
  } 

  // enrich it
  if (enrichers[options.presetName]) {
    result = await enrichers[options.presetName](result)
  } 
  
  // second validate 
  if (secondvalidators[options.presetName]) {
    await secondvalidators[options.presetName](result)
  }

  return result
}

module.exports = { 
  readparsevalidate, 
  _onlyfortesting_firstvalidators: firstvalidators,
}

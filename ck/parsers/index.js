const fs = require('fs')
const fsp = require('fs').promises

const { unenrichedschemas } = require('../schemas/unenriched/index')

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

const validators = {
  'flow.json': (obj) => {
    const schema = unenrichedschemas.workflow // TODO not only support sequence lol
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
  if (!validators[options.presetName]) {
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
  await validators[options.presetName](result)

  return result
}

module.exports = { 
  readparsevalidate, 
  _onlyfortesting_unenrichedvalidators: validators,
}

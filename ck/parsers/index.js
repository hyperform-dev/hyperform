const fs = require('fs')
const joi = require('joi')
const fsp = require('fs').promises

const readers = {
  'flow.json': (path) => {
    // check if deploy.json present
    if (fs.existsSync(path) === false) {
      throw new Error('No flow.json found in this directory')
    }
    // try to read it
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
    const schema = joi.array().items(
      joi.object({
        run: joi.string().required(),
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
  if (!validators[options.presetName]) {
    throw new Error(`UNIMEPLEMENTED: reader for ${options.presetName}`)
  }

  if (!options.presetName || !options.path) {
    throw new Error('DEV: readparsevalidate: specify presetName and path')
  }

  const read = await readers[options.presetName](options.path)
  const parsed = await parsers[options.presetName](read)
  const validated = await validators[options.presetName](parsed)

  return parsed
}

module.exports = { 
  readparsevalidate, 
  _onlyfortesting_validators: validators,
}

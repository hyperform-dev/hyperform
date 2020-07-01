const joi = require('joi')
const fs = require('fs')
const fsp = require('fs').promises

// TODO make slimmer
// 1)
const readers = {
  'deploy.json': (path) => {
    // check if deploy.json present
    if (fs.existsSync(path) === false) {
      throw new Error('No deploy.json found in this directory')
    }

    // try to read file content
    return fsp.readFile(path, { encoding: 'utf8' })
      .catch((e) => {
        console.log('Could not read deploy.json')
        throw e
      })
  },
}

// 2)
const parsers = {
  'deploy.json': (contents) => {
    let parsedJson
    try {
      parsedJson = JSON.parse(contents)
      return parsedJson
    } catch (e) {
      console.log('deploy.json contains invalid JSON')
      throw e
    }
  },
}

// 3)
const validators = {
  'deploy.json': (obj) => {
    const schema = joi.array().items(
      joi.object({
        forEachIn: joi.string().required(),
        do: joi.string(),
        upload: joi.string().required(),
        config: joi.object({
          role: joi.string().required(),
          timeout: joi.number(),
        }).required(),
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
  // Force us to implement all three for every config we parse
  if (!readers[options.presetName]) throw new Error(`UNIMPLEMENTED: reader for ${options.presetName} preset`)
  if (!parsers[options.presetName]) throw new Error(`UNIMPLEMENTED: parser for ${options.presetName} preset`)
  if (!validators[options.presetName]) throw new Error(`UNIMPLEMENTED: validator for ${options.presetName} preset`)

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

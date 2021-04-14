// validates and parses hyperform.json 

const path = require('path')
const { amazonSchema, googleSchema } = require('../schemas/index')

let parsedHyperformJson 

/**
 * @description Parses v,alidates, and returns contents of "dir"/hyperform.json
 * @param {string} dir Directory where to look for hyperform.json
 * @param {string} platform Whether to expect 'amazon' or 'google' content
 * 
 */
function getParsedHyperformJson(dir, platform) {
  if (parsedHyperformJson == null) {
    const json = require(path.join(dir, 'hyperform.json'))
    // validate its schema
    let schema 
    if (platform === 'amazon') schema = amazonSchema
    if (platform === 'google') schema = googleSchema
    // throws if platform is not 'amazon' or 'google'
    const { error, value } = schema.validate(json)
    if (error) {
      throw new Error(`${error} ${value}`)
    }
    parsedHyperformJson = json 
  }

  return parsedHyperformJson
}

module.exports = {
  getParsedHyperformJson,
}

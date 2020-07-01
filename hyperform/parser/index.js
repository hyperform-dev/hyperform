// validates and parses hyperform.json 

const path = require('path')
const fs = require('fs')
const schema = require('../schemas/index').hyperformJsonSchema

let parsedHyperformJson 

/**
 * @description Returns the parsed contents of "dir"/hyperform.json
 * @param {string} dir Directory where to look for hyperform.json
 * @returns {*} Parsed contents of "dir"/hyperform.json
 * @throws ENOENT if could not open hyperform.json, SyntaxError if it contains invalid JSON
 * 
 */
function getParsedHyperformJson(dir) {
  if (dir == null) {
    throw new Error(`dir must be defined but is ${dir}`) // HF programmer mistake
  }
  
  if (parsedHyperformJson == null) {
    const fp = path.join(dir, 'hyperform.json')
    let json = fs.readFileSync(fp, { encoding: 'utf-8' })
    // parse it as JSON
    json = JSON.parse(json)
    // validate its schema
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

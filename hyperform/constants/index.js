// validates and parses hyperform.json 

const path = require('path')
const fs = require('fs')
const schema = require('../schemas/index').hyperformJsonSchema

let constants 

/**
 * 
 * @param {string} dir Dir to look for hyperform.json
 */
function getConstants(dir) {
  if (dir == null) {
    throw new Error(`dir must be defined but is ${dir}`) // HF programmer mistake
  }
  
  if (constants == null) {
    const fp = path.join(dir, 'hyperform.json')
    let json = fs.readFileSync(fp, { encoding: 'utf-8' })
    // parse it as JSON
    json = JSON.parse(json)
    // validate its schema
    const { error, value } = schema.validate(json)
    if (error) {
      throw new Error(`${error} ${value}`)
    }
    constants = json 
  }

  return constants
}

module.exports = {
  getConstants,
}

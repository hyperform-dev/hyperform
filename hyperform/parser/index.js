// validates and parses hyperform.json 

const path = require('path')
const fsp = require('fs').promises
const { schema } = require('../schemas/index').hyperformJsonSchema

let parsedHyperformJson

async function getParsedHyperformJson(dir) {
  if (parsedHyperformJson == null) {
    // try to read hyperform.json
    const fp = path.join(dir, 'hyperform.json')
    let json = await fsp.readFile(fp)
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

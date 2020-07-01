const joi = require('joi')

const atomic = joi.object({
  run: joi.string().required(),
  in: joi.string().required(),
  id: joi.string().required(),
})

const sequence = joi.array().items(
  atomic,
)

const workflow = sequence

const enrichedschemas = {
  atomic,
  sequence,
  workflow,
}

module.exports = {
  enrichedschemas,
}

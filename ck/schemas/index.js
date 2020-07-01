const joi = require('joi')

// schemas for user-written flow.json
const firstschemas = {
  'sequence': joi.array().items(
    joi.object({
      run: joi.string().required(),
    }),
  ),
}

// schemas for user-written flow.json after enrichment 
// (internal representation)
const secondschemas = {
  'sequence': joi.array().items(
    joi.object({
      run: joi.string().required(),
      in: joi.string().required(),
      id: joi.string().required(),
    }),
  ),
}

module.exports = {
  firstschemas,
  secondschemas,
}

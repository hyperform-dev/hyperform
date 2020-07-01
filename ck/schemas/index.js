const joi = require('joi')

// schemas for user-written flow.json
const first_sequence = joi.array().items(
  joi.object({
    run: joi.string().required(),
  }),
)

/// //////////////////////////////////

// schemas for user-written flow.json after enrichment 
// (internal representation)

const second_atomic = joi.object({
  run: joi.string().required(),
  in: joi.string().required(),
  id: joi.string().required(),
})

const second_sequence = joi.array().items(
  second_atomic,
)

/// ////////////////////////////////////
/// ////////////////////////////////////

const firstschemas = {
  'sequence': first_sequence,
}

const secondschemas = {
  'atomic': second_atomic,
  'sequence': second_sequence,
}

module.exports = {
  firstschemas,
  secondschemas,
}

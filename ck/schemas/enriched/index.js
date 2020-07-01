const joi = require('joi')

const func = joi.array().items(
  // atomic
  joi.object({
    run: joi.string().required(),
    in: joi.alternatives().try(
      joi.string(),
      joi.array(),
    ).required(),
    id: joi.string().required(),
  }),
  // sequence
  joi.link('..'),
  // doParallel 
  joi.object({
    doParallel: joi.link('...').required(),
  }),
)

const workflow = func

const flat_atomic = joi.object({
  run: joi.string().required(),
  in: joi.alternatives().try(
    joi.string(),
    joi.array(),
  ).required(),
  id: joi.string().required(),
})

const flat_sequence = joi.array() 

const flat_doParallel = joi.object({
  doParallel: joi.array().required(),
})

const enrichedschemas = {
  workflow,
  flat_atomic,
  flat_sequence,
  flat_doParallel,
}

module.exports = {
  enrichedschemas,
}

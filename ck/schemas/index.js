const joi = require('joi')

// schemas for user-written flow.json
const unenriched_sequence = joi.array().items(
  joi.object({
    run: joi.string().required(),
  }),
)

/// //////////////////////////////////

// schemas for user-written flow.json after enrichment 
// (internal representation)

const enriched_atomic = joi.object({
  run: joi.string().required(),
  in: joi.string().required(),
  id: joi.string().required(),
})

const enriched_sequence = joi.array().items(
  enriched_atomic,
)

/// ////////////////////////////////////
/// ////////////////////////////////////

const unenrichedschemas = {
  sequence: unenriched_sequence,
}

const enrichedschemas = {
  atomic: enriched_atomic,
  sequence: enriched_sequence,
}

module.exports = {
  unenrichedschemas,
  enrichedschemas,
}

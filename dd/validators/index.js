const joi = require('joi')

/**
 * 
 * @param {} obj
 */
function isValidDeployJson(obj) {
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
}

module.exports = {
  isValidDeployJson,
}

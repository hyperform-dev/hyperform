const joi = require('joi')

const hyperformJsonSchema = joi.object({
  amazon: joi.object({
    aws_access_key_id: joi.string().required(),
    aws_secret_access_key: joi.string().required(), // TODO should allow empty fields
    aws_default_region: joi.string().required(),
  }),
})

module.exports = {
  hyperformJsonSchema,
}

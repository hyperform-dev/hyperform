const joi = require('joi')

const hyperformJsonSchema = joi.object({
  amazon: joi.object({
    aws_access_key_id: joi.string().required().allow(''),
    aws_secret_access_key: joi.string().required().allow(''), 
    aws_default_region: joi.string().required().allow(''),
  }).required(),
  google: joi.object({
    gc_project: joi.string().required().allow(''),
    gc_client_email: joi.string().required().allow(''),
    gc_private_key: joi.string().required().allow(''),
  }).required(),
})

module.exports = {
  hyperformJsonSchema,
}

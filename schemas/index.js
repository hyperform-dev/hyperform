const joi = require('joi')

const amazonSchema = joi.object({
  amazon: joi.object({
    aws_access_key_id: joi.string().required(),
    aws_secret_access_key: joi.string().required(), 
    aws_region: joi.string().required(),
    // allow if user enters it
    aws_session_token: joi.string().allow(''),
  }).required(),
})

const googleSchema = joi.object({
  google: joi.object({
    gc_project: joi.string().required(),
    gc_region: joi.string().required(),
  }).required(),
})

module.exports = {
  amazonSchema,
  googleSchema,
}

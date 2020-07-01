const joi = require('joi')

const task = joi.object({
  forEachIn: joi.string().required(),
  do: joi.string(),
  upload: joi.string().required(),
  config: joi.object({
    amazon: joi.object({
      role: joi.string().required(),
      timeout: joi.number(),
      language: joi.string().valid('js', 'java'),
      region: joi.string(),
      handler: joi.string()
        .when('language', { is: 'java', then: joi.required() })
      ,
    }),
  }).required(),

})

const deployJson = joi.array().items(
  task,
).required()

const unenrichedschemas = {
  task,
  deployJson,
}

module.exports = {
  unenrichedschemas,
}

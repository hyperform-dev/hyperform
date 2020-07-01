/* eslint-disable global-require */
describe('schemas', () => {
  describe('hyperform.json schema', () => {
    describe('valid cases', () => {
      test('allows empty string fields', () => {
        const { hyperformJsonSchema } = require('./index')

        const input = {
          amazon: {
            aws_access_key_id: '',
            aws_secret_access_key: '',
            aws_default_region: '',
          },
          google: {
            gc_project: '',
            gc_client_email: '',
            gc_private_key: '',
          },
        }

        const { error } = hyperformJsonSchema.validate(input)
        expect(error).not.toBeDefined()
      })

      test('allows normal string fields', () => {
        const { hyperformJsonSchema } = require('./index')

        const input = {
          amazon: {
            aws_access_key_id: 'abc',
            aws_secret_access_key: 'abc',
            aws_default_region: 'abc',
          },
          google: {
            gc_project: 'abc',
            gc_client_email: 'abc',
            gc_private_key: 'abc',
          },
        }

        const { error } = hyperformJsonSchema.validate(input)
        expect(error).not.toBeDefined()
      })
    })

    describe('invalid cases', () => {
      test('does not allow missing provider', () => {
        const { hyperformJsonSchema } = require('./index')

        const input = {
          amazon: {
            aws_access_key_id: '',
            aws_secret_access_key: '',
            aws_default_region: '',
          },
        }

        const { error } = hyperformJsonSchema.validate(input)
        expect(error).toBeDefined()
      })

      test('does not allow missing field', () => {
        const { hyperformJsonSchema } = require('./index')

        const input = {
          amazon: {
            aws_access_key_id: '',
            aws_secret_access_key: '',
            // Missing: aws_default_region: '',
          },
          google: {
            gc_project: '',
            gc_client_email: '',
            gc_private_key: '',
          },
        }

        const { error } = hyperformJsonSchema.validate(input)
        expect(error).toBeDefined()
      })
    })
  })
})

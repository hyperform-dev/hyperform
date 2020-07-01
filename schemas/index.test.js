/* eslint-disable global-require */
describe('schemas', () => {
  describe('hyperform.json schema', () => {
    describe('valid cases', () => {
      test('allows empty string fields in amazon', () => {
        const { hyperformJsonSchema } = require('./index')

        const input = {
          amazon: {
            aws_access_key_id: '',
            aws_secret_access_key: '',
            aws_default_region: '',
          },
        }

        const { error } = hyperformJsonSchema.validate(input)
        expect(error).not.toBeDefined()
      })

      test('allows normal string fields in google', () => {
        const { hyperformJsonSchema } = require('./index')

        const input = {
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
      test('does not allow both providers', () => {
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
        expect(error).toBeDefined()
      })

      test('does not allow no provider', () => {
        const { hyperformJsonSchema } = require('./index')

        const input = {
          // empty
        }

        const { error } = hyperformJsonSchema.validate(input)
        expect(error).toBeDefined()
      })

      test('does not allow missing field in amazon', () => {
        const { hyperformJsonSchema } = require('./index')

        const input = {
          amazon: {
            aws_access_key_id: '',
            aws_secret_access_key: '',
            // Missing: aws_default_region: '',
          },
        }

        const { error } = hyperformJsonSchema.validate(input)
        expect(error).toBeDefined()
      })
    })
  })
})

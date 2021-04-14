/* eslint-disable global-require */
describe('schemas', () => {
  describe('amazon schema', () => {
    test('normal case', () => {
      const { amazonSchema } = require('./index')

      const input = {
        amazon: {
          aws_access_key_id: 'xx',
          aws_secret_access_key: 'xx',
          aws_region: 'xx',
        },
      }

      const { error } = amazonSchema.validate(input)
      expect(error).not.toBeDefined()
    })

    test('allows aws_session_token field', () => {
      const { amazonSchema } = require('./index')

      const input = {
        amazon: {
          aws_access_key_id: 'xx',
          aws_secret_access_key: 'xx',
          aws_region: 'xx',
          aws_session_token: 'xx',
        },
      }

      const { error } = amazonSchema.validate(input)
      expect(error).not.toBeDefined()
    })

    test('does not allow missing field in amazon', () => {
      const { amazonSchema } = require('./index')

      const input = {
        amazon: {
          aws_access_key_id: 'xx',
          aws_secret_access_key: 'xx',
          // Missing: aws_region: '',
        },
      }

      const { error } = amazonSchema.validate(input)
      expect(error).toBeDefined()
    })

    test('does not allow both providers', () => {
      const { amazonSchema } = require('./index')

      const input = {
        amazon: {
          aws_access_key_id: 'abc',
          aws_secret_access_key: 'abc',
          aws_region: 'abc',
        },
        google: {
          gc_project: 'abc',
          gc_region: 'abc',
        },
      }

      const { error } = amazonSchema.validate(input)
      expect(error).toBeDefined()
    })

    test('does not allow no provider', () => {
      const { amazonSchema } = require('./index')

      const input = {
        // empty
      }

      const { error } = amazonSchema.validate(input)
      expect(error).toBeDefined()
    })
  })

  describe('google schema', () => {
    test('normal case', () => {
      const { googleSchema } = require('./index')

      const input = {
        google: {
          gc_project: 'abc',
          gc_region: 'abc',
        },
      }

      const { error } = googleSchema.validate(input)
      expect(error).not.toBeDefined()
    })
  })
})

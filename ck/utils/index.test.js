const { validateOutput } = require('./index')

describe('utils', () => {
  describe('validating envoy output', () => {
    describe('does not throw on valid cases', () => {
      test('object', () => {
        const input = { a: 1 }
        const name = 'somename'
        const toBeTested = () => validateOutput(input, name)

        expect(toBeTested)
          .not
          .toThrow()
      })

      test('number', () => {
        const input = 1
        const name = 'somename'
        const toBeTested = () => validateOutput(input, name)

        expect(toBeTested)
          .not
          .toThrow()
      })

      test('string', () => {
        const input = 'xxx'
        const name = 'somename'
        const toBeTested = () => validateOutput(input, name)

        expect(toBeTested)
          .not
          .toThrow()
      })
    })
    describe('throws on invalid cases', () => {
      test('double-stringified object', () => {
        const input = '{ "a": 1 }'
        const name = 'somename'
        const toBeTested = () => validateOutput(input, name)

        expect(toBeTested)
          .toThrow()
      })

      test('double-stringified array', () => {
        const input = '[ 1,2,3 ]'
        const name = 'somename'
        const toBeTested = () => validateOutput(input, name)

        expect(toBeTested)
          .toThrow()
      })
    })
  })
})

const { validateOutput } = require('./index')
const { getAllFunctionNames } = require('./index')

// TODO see if current ck can handle arrays
// TODO only allow arrays, objects in validateoutput

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

      test('array', () => {
        const input = { a: 1 }
        const name = 'somename'
        const toBeTested = () => validateOutput(input, name)

        expect(toBeTested)
          .not
          .toThrow()
      })
    })
    describe('throws on invalid cases', () => {
      test('string (sorry amazon)', () => {
        const input = 'xxxxx'
        const name = 'somename'
        const toBeTested = () => validateOutput(input, name)

        expect(toBeTested)
          .toThrow()
      })

      test('number (sorry amazon)', () => {
        const input = 1
        const name = 'somename'
        const toBeTested = () => validateOutput(input, name)

        expect(toBeTested)
          .toThrow()
      })

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

  describe('getAllFunctionNames', () => {
    test('case A', () => {
      const expected = ['myinc', 'myinc1', 'myinc.1']

      const input = [
        { run: 'myinc' },
        {
          doParallel: [
            { run: 'myinc1' },
          ],
        },
        { run: 'myinc.1' },
      ]

      const toBeTested = () => getAllFunctionNames(input)

      expect(toBeTested()).toEqual(expected)
    })
  })
})

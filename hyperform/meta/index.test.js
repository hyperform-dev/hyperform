const { isInTesting } = require('./index')

describe('meta', () => {
  describe('isInTesting', () => {
    test('returns true', () => {
      const toBeTested = () => isInTesting()
      expect(toBeTested()).toBe(true)
    })
  })
})

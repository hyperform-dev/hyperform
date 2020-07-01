const { Watch } = require('./index')

describe('ultra', () => {
  describe('watch', () => {
    test('throws on on dir given', () => {
      const toBeTested = () => {
        const w = new Watch()
      }

      expect(toBeTested).toThrow()
    })
  })
})

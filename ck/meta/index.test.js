const { isInTesting } = require('./index')

describe('meta', () => {
  test('isintesting should return true', () => {
    const toBeTested = () => isInTesting()
    expect(toBeTested()).toEqual(true)
  })
})

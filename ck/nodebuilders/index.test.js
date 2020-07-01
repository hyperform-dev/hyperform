const detectnodetype = require('./index')._onlyfortesting_detectnodetype

describe('detectnodetype', () => {
  describe('detects valid ones correctly', () => {

  })
  test('atomic (enriched)', () => {
    const input = {
      run: 'xxx',
      in: 'xxx',
      //   id: 'xxx',
    }

    const toBeTested = () => detectnodetype(input)

    expect(toBeTested()).toBe('atomic')
  })

  test('sequence (enriched)', () => {
    const input = [
      {
        run: 'xxx',
        in: 'xxx',
        id: 'xxx',
      },
    ]

    const toBeTested = () => detectnodetype(input)

    expect(toBeTested()).toBe('sequence')
  })
})

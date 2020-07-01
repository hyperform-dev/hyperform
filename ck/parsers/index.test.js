const validators = require('./index')._onlyfortesting_validators

describe('validators', () => {
  describe('for flow.json', () => {
    describe('it accepts correct schemas: names, ARNs, URLs', () => {
      test('full', async () => {
        const input = [
          { run: 'function1' },
          { run: 'arn:aws:iam::735406098573:role/lambdaexecute' },
          { run: 'google.com' }, // URLs are allowed
        ]
        
        const toBeTested = () => validators['flow.json'](input)

        expect(toBeTested)
          .not 
          .toThrow()
      })

      test('minimal', async () => {
        const input = [
          { run: 'function1' },
        ]
        
        const toBeTested = () => validators['flow.json'](input)

        expect(toBeTested)
          .not 
          .toThrow()
      })

      test('no nodes', async () => {
        const input = [
        ]
        
        const toBeTested = () => validators['flow.json'](input)

        expect(toBeTested)
          .not 
          .toThrow()
      })
    })
  })
})

const firstvalidators = require('./index')._onlyfortesting_firstvalidators

describe('firstvalidators', () => {
  describe('for flow.json', () => {
    describe('it accepts correct schemas: names, ARNs, URLs', () => {
      test('full', async () => {
        const input = [
          { run: 'function1' },
          { run: 'arn:aws:iam::735406098573:role/lambdaexecute' },
          { run: 'google.com' }, // URLs are allowed
        ]
        
        const toBeTested = () => firstvalidators['flow.json'](input)

        expect(toBeTested)
          .not 
          .toThrow()
      })

      test('minimal', async () => {
        const input = [
          { run: 'function1' },
        ]
        
        const toBeTested = () => firstvalidators['flow.json'](input)

        expect(toBeTested)
          .not 
          .toThrow()
      })

      test('no nodes', async () => {
        const input = [
        ]
        
        const toBeTested = () => firstvalidators['flow.json'](input)

        expect(toBeTested)
          .not 
          .toThrow()
      })

      test('with in field', async () => {
        const input = [
          { run: 'function1', in: 'abcde' },
          { run: 'arn:aws:iam::735406098573:role/lambdaexecute' },
          { run: 'google.com' }, // URLs are allowed
        ]
        
        const toBeTested = () => firstvalidators['flow.json'](input)

        expect(toBeTested)
          .not 
          .toThrow()
      })
    })

    describe('it rejects incorrect schemas', () => {
      test('with empty in field', async () => {
        const input = [
          { run: 'function1', in: '' },
          { run: 'arn:aws:iam::735406098573:role/lambdaexecute' },
          { run: 'google.com' }, // URLs are allowed
        ]
        
        const toBeTested = () => firstvalidators['flow.json'](input)

        expect(toBeTested)
          .toThrow()
      })
    })
  })
  // TODO test secondvalidators
})

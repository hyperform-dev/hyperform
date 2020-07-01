const validators = require('./index')._onlyfortesting_validators

describe('validators', () => {
  describe('for deploy.json', () => {
    describe('it accepts correct schemas', () => {
      test('full', async () => {
        const input = [
          {
            forEachIn: 'javalambdas',
            do: 'mvn install;',
            upload: 'target/out1.0.0.jar',
            config: {
              role: 'arn:aws:lambda:us-east-2:735406098573:role:woegnwoeg',
              timeout: 60,
            },
          },
        ]
        
        const toBeTested = () => validators['deploy.json'](input)

        expect(toBeTested)
          .not 
          .toThrow()
      })

      test('minimal', async () => {
        const input = [
          {
            forEachIn: 'javalambdas',
            upload: 'target/out1.0.0.jar',
            config: {
              role: 'arn:aws:lambda:us-east-2:735406098573:role:woegnwoeg',
            },
          },
        ]
        
        const toBeTested = () => validators['deploy.json'](input)

        expect(toBeTested)
          .not 
          .toThrow()
      })
    })
  })
})

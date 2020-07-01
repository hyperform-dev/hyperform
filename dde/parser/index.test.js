const validators = require('./index')._onlyfortesting_validators

describe('validators', () => {
  describe('for deploy.json', () => { // mostly regression tests when we change the schema
    describe('it accepts correct schemas', () => {
      test('full', async () => {
        const input = [
          {
            forEachIn: 'javalambdas',
            do: 'mvn install;',
            upload: 'target/out1.0.0.jar',
            config: {
              amazon: {
                role: 'arn:aws:lambda:us-east-2:735406098573:role:woegnwoeg',
                timeout: 60,
                language: 'js',
                handler: 'xxxx',
              },
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
              amazon: {
                role: 'arn:aws:lambda:us-east-2:735406098573:role:woegnwoeg',
              },
            },
          },
        ]
        
        const toBeTested = () => validators['deploy.json'](input)

        expect(toBeTested)
          .not 
          .toThrow()
      })

      test('missing handler in js (allowed)', async () => {
        const input = {
          forEachIn: 'javalambdas',
          upload: 'target/out1.0.0.jar',
          config: {
            amazon: {
              role: 'arn:aws:lambda:us-east-2:735406098573:role:woegnwoeg',
              language: 'js',
            },
          },
        }
        
        const toBeTested = () => validators['deploy.json'](input)

        expect(toBeTested)
          .toThrow()
      })
    })

    describe('it rejects incorrect schemas', () => {
      test('object', async () => {
        const input = {
          forEachIn: 'javalambdas',
          upload: 'target/out1.0.0.jar',
          config: {
            amazon: {
              role: 'arn:aws:lambda:us-east-2:735406098573:role:woegnwoeg',
            },
          },
        }
        
        const toBeTested = () => validators['deploy.json'](input)

        expect(toBeTested)
          .toThrow()
      })

      test('missing config.role', async () => {
        const input = [ 
          {
            forEachIn: 'javalambdas',
            upload: 'target/out1.0.0.jar',
            config: {
              amazon: {
                
              },
            },
          },
        ]
        
        const toBeTested = () => validators['deploy.json'](input)

        expect(toBeTested)
          .toThrow()
      })

      test('missing config', async () => {
        const input = [
          {
            forEachIn: 'javalambdas',
            upload: 'target/out1.0.0.jar',
          },
        ]
        
        const toBeTested = () => validators['deploy.json'](input)

        expect(toBeTested)
          .toThrow()
      })

      test('top-level role', async () => {
        const input = [
          {
            forEachIn: 'javalambdas',
            upload: 'target/out1.0.0.jar',
            role: 'arnxxxxxxxxxxxxxxxxxxxxxx',
            config: { 
              amazon: {
                role: 'arnxxxxxxxxxxxxxxxxxxxxxx',
              },
            },
          },
        ]
        
        const toBeTested = () => validators['deploy.json'](input)

        expect(toBeTested)
          .toThrow()
      })

      test('mid-level role', async () => {
        const input = [
          {
            forEachIn: 'javalambdas',
            upload: 'target/out1.0.0.jar',
            config: { 
              role: 'arnxxxxxxxxxxxxxxxxxxxxxx',
              amazon: {
              },
            },
          },
        ]
        
        const toBeTested = () => validators['deploy.json'](input)

        expect(toBeTested)
          .toThrow()
      })

      test('missing handler in java (disallowed)', async () => {
        const input = {
          forEachIn: 'javalambdas',
          upload: 'target/out1.0.0.jar',
          config: {
            amazon: {
              role: 'arn:aws:lambda:us-east-2:735406098573:role:woegnwoeg',
              language: 'java',
            },
          },
        }
        
        const toBeTested = () => validators['deploy.json'](input)

        expect(toBeTested)
          .toThrow()
      })
    })
  })
})

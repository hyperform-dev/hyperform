const fs = require('fs')
const path = require('path')
const validators = require('./index')._onlyfortesting_validators
const { readparsevalidate } = require('./index')

function setupMockJs(deployJsonContents) {
  const p = `/tmp/${Math.ceil(Math.random() * 100000 + 10000)}` // TODO lol make unique, OS-safe
  fs.mkdirSync(p)
  fs.writeFileSync(`${p}/deploy.json`, deployJsonContents)

  return p;
}

describe('validators', () => {
  describe('for deploy.json', () => { // mostly regression tests when we change the schema
    describe('MODULE', () => {
      describe('does not throw on valid deploy.json file', () => {
        test('full', async () => {
          const deployJsonContents = JSON.stringify(
            [
              {
                forEachIn: 'lambdas',
                do: 'npm i; zip -r deploypackage.zip .',
                upload: 'deploypackage.zip',
                config: {
                  amazon: {
                    role: 'arn:aws:lambda:us-east-2:735406098573:role:woegnwoeg',
                    timeout: 60,
                    language: 'js',
                    handler: 'xxxx',
                  },
                },
              },
            ],
          )
          const p = setupMockJs(deployJsonContents)
          const toBeTested = () => readparsevalidate({
            presetName: 'deploy.json',
            path: path.join(p, 'deploy.json'),
          })
          let err 
          try {
            await toBeTested()
          } catch (e) {
            err = e
          }

          expect(err).not.toBeDefined()
        })
      })
    })
    describe('UNIT', () => {
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
})

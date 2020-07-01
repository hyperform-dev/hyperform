const { isValidDeployJson } = require('./index')

describe('deploy.json Validator', () => {
  describe('if it recognizes valid', () => {
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

      const toBeTested = () => isValidDeployJson(input)
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

      const toBeTested = () => isValidDeployJson(input)
      expect(toBeTested)
        .not
        .toThrow()
    })
  })
})

const zipper = require('../../zipper/index')

// Omit tests for sub functions
// Those, eg. terminal command generators, will be replaced anyway with SDKs

describe('deployer', () => {
  describe('amazon', () => {
    describe('deployAmazon', () => {
      // TODO test if lambda does not exist, clean up lambda afterwards
            
      // allow 15 seconds
      test('completes if Lambda already exists, and returns ARN', async () => {
        const { deployAmazon } = require('./index')
        const { zip } = require('../../zipper/index')

        /// //////////////////////////////////////////////
        // Setup: create code zip

        const name = 'jest-reserved-returna1'
        const code = `module.exports = { ${name}: () => ({a: 1}) }`

        const zipPath = await zip(code)

        /// ////////////////////////////////////////////////////

        const options = {
          name: name,
        }

        let err 
        let lambdaArn 
        try {
          lambdaArn = await deployAmazon(zipPath, options)
        } catch (e) {
          err = e
        }

        // it completed
        expect(err).not.toBeDefined()

        // it's an ARN
        expect(typeof lambdaArn).toBe('string')
        const arnRegex = /arn:(aws[a-zA-Z-]*)?:lambda:[a-z]{2}((-gov)|(-iso(b?)))?-[a-z]+-\d{1}:\d{12}:function:[a-zA-Z0-9-_]+(:(\$LATEST|[a-zA-Z0-9-_]+))?/
        expect(arnRegex.test(lambdaArn)).toBe(true)
      }, 15 * 1000)
    })
  })
})

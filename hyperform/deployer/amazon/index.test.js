/* eslint-disable global-require */

const LAMBDANAME = 'jest-reserved-returna1'
const LAMBDAREGION = 'us-east-2'

// After all tests, delete the Lambda
afterAll(async () => {
  const { deleteAmazon } = require('./index')
  try {
    await deleteAmazon(LAMBDANAME, LAMBDAREGION)
  } catch (e) {
    /* tests themselves already deleted the Lambda */
  }
}) 

// Helpers 
const arnRegex = /arn:(aws[a-zA-Z-]*)?:lambda:[a-z]{2}((-gov)|(-iso(b?)))?-[a-z]+-\d{1}:\d{12}:function:[a-zA-Z0-9-_]+(:(\$LATEST|[a-zA-Z0-9-_]+))?/
const isArn = (str) => (typeof str === 'string') && (arnRegex.test(str) === true)

describe('deployer', () => {
  describe('amazon', () => {
    describe('deployAmazon', () => {
      test('completes if Lambda does not exist, and returns ARN', async () => {
        const { deleteAmazon, deployAmazon } = require('./index.js')
        const { zip } = require('../../zipper/index')

        /// //////////////////////////////////////////////
        // Setup: delete function if it exists already

        try {
          await deleteAmazon(LAMBDANAME, LAMBDAREGION)
          // deleted function
        } catch (e) {
          if (e.code === 'ResourceNotFoundException') {
            // does not exist in the first place, nice
          } else {
            throw e
          }
        }

        /// //////////////////////////////////////////////
        // Setup: create code zip

        const code = `module.exports = { ${LAMBDANAME}: () => ({a: 1}) }`
 
        const zipPath = await zip(code)
 
        /// ////////////////////////////////////////////////////
 
        const options = {
          name: LAMBDANAME,
          region: LAMBDAREGION,
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
        expect(isArn(lambdaArn)).toBe(true)

        // TODO
      }, 15 * 1000)

      test('completes if Lambda already exists, and returns ARN', async () => {
        const { deployAmazon } = require('./index')
        const { zip } = require('../../zipper/index')
        
        /// //////////////////////////////////////////////
        // Setup: create code zip
        
        const code = `module.exports = { ${LAMBDANAME}: () => ({a: 1}) }`
        
        const zipPath = await zip(code)

        /// //////////////////////////////////////////////
        // Setup: ensure function exists already
        
        const options = {
          name: LAMBDANAME,
          region: LAMBDAREGION,
        }
        try {
          await deployAmazon(zipPath, options)
        } catch (e) {
          if (e.code === 'ResourceConflictException') {
            /* exists already anyway, cool */
          } else {
            throw e
          }
        }

        /// ////////////////////////////////////////////////////
        // Actual test

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
        expect(isArn(lambdaArn)).toBe(true)
      }, 30 * 1000)
    })

    // TODO more tests for the other methods
  })
})

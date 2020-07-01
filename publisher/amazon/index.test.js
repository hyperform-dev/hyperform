/* eslint-disable global-require */
const APIREGION = 'us-east-2'

// other functions in publisher/amazon are pretty well covered by other tests
describe('utils', () => {
  describe('createApi', () => {
    test('completes and returns apiId and apiUrl that is an URL', async () => {
      const uuidv4 = require('uuid').v4 
      const { createApi } = require('./utils')
      const deleteApi = require('./utils')._only_for_testing_deleteApi
      
      const apiName = `jest-reserved-api-${uuidv4()}`
      
      let err 
      let res 
      try {
        res = await createApi(apiName, APIREGION)
      } catch (e) {
        console.log(e)
        err = e
      }

      // createApi did not throw
      expect(err).not.toBeDefined()
      expect(res).toBeDefined()
      expect(typeof res.apiUrl).toBe('string')
      expect(typeof res.apiId).toBe('string')

      // apiUrl is an URL 
      const tryUrl = () => new URL(res.apiUrl)
      expect(tryUrl).not.toThrow()

      /// //////////////////////
      // Clean up: Delete API

      await deleteApi(res.apiId, APIREGION)
    }, 10000)
  })
})

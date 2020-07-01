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

  describe('setRoute', () => {
    test('completes on non-existing routes, existing routes', async () => {
      /// Create API
      const uuidv4 = require('uuid').v4 
      const fetch = require('node-fetch')
      const {
        createApi, createIntegration, setRoute, createDefaultAutodeployStage, 
      } = require('./utils')
      const deleteApi = require('./utils')._only_for_testing_deleteApi
      
      const apiName = `jest-reserved-api-${uuidv4()}`
      const routePath = '/endpoint_test'
      
      const { apiId, apiUrl } = await createApi(apiName, APIREGION)
      
      // Create Integration to some lambda
      // we won't call it, so doesn't matter really which lambda 
      const targetLambdaArn = 'arn:aws:lambda:us-east-2:735406098573:function:endpoint_hello'
      const integrationId = await createIntegration(apiId, APIREGION, targetLambdaArn)

      // Always make changes public (importantly, things we will do with setRoute)
      await createDefaultAutodeployStage(apiId, APIREGION)
       
      let res 
      let err 
      try {
        res = await setRoute(
          apiId,
          APIREGION,
          routePath,
          integrationId,
        )
      } catch (e) {
        err = e
      }

      // setRoute did not throw
      expect(err).not.toBeDefined()
      const fullurl = `${apiUrl}${routePath}`
      console.log(fullurl)
      // URL returns 200
      // On GET
      {
        const getres = await fetch(fullurl, {
          method: 'GET',
        })
        const statusCode = getres.status
        // GET route returns 2XX
        expect(/^2/.test(statusCode)).toBe(true)
      }
      // On POST
      {
        const getres = await fetch(fullurl, {
          method: 'POST',
        })
        const statusCode = getres.status
        // POST route returns 2XX
        expect(/^2/.test(statusCode)).toBe(true)
      }

      await deleteApi(apiId, APIREGION)
    }, 10000)
  })
})

describe('authorizer-gen', () => {
  describe('index', () => {
    describe('getRouteId', () => {
      test('returns non-empty string for existing route', async () => {
        const getRouteId = require('./index')._only_for_testing_getRouteId

        const apiId = 'vca3i8138h' // first-http-api in my API Gateway
        const routeKey = '$default'

        let err 
        let res 
        try {
          res = await getRouteId(apiId, routeKey)
        } catch (e) {
          err = e
        }

        // It did not throw
        expect(err).not.toBeDefined()
        // Returned routeid: a non-empty string
        expect(res).toBeDefined()
        expect(typeof res).toEqual('string')
        expect(res.length > 0).toEqual(true)
      })

      test('throws for non-existing API', async () => {
        const getRouteId = require('./index')._only_for_testing_getRouteId

        const apiId = 'invalid-api-id' 
        const routeKey = '$default'

        let err 
        let res 
        try {
          res = await getRouteId(apiId, routeKey)
        } catch (e) {
          err = e
        }
        // It threw
        expect(err).toBeDefined()
        expect(err.toString()).toMatch(/Invalid API identifier/)
      })

      test('throws for non-existing route', async () => {
        const getRouteId = require('./index')._only_for_testing_getRouteId

        const apiId = 'vca3i8138h' // first-http-api in my API Gateway
        const routeKey = 'invalid-route-name'

        let err 
        let res 
        try {
          res = await getRouteId(apiId, routeKey)
        } catch (e) {
          err = e
        }

        // It threw
        expect(err).toBeDefined()
      })
    })

    describe('deployAuthorizer', () => {
      test('throws on expectedBearer shorter than 10 digits (not secure)', async () => {
        const { deployAuthorizer } = require('./index')

        const authorizerName = 'jest-deployed-authorizer'
        const authorizerRegion = 'us-east-2'
        const expectedBearer = '123456789  ' 
        let err 
        try {
          await deployAuthorizer(authorizerName, expectedBearer, authorizerRegion)
        } catch (e) {
          err = e
        }

        expect(err).toBeDefined()
      })

      test('throws on expectedBearer is null', async () => {
        const { deployAuthorizer } = require('./index')

        const authorizerName = 'jest-deployed-authorizer'
        const authorizerRegion = 'us-east-2'
        const expectedBearer = null 
        let err 
        try {
          await deployAuthorizer(authorizerName, expectedBearer, authorizerRegion)
        } catch (e) {
          err = e
        }

        expect(err).toBeDefined()
      })
        
      test('throws on expectedBearer is empty string', async () => {
        const { deployAuthorizer } = require('./index')

        const authorizerName = 'jest-deployed-authorizer'
        const authorizerRegion = 'us-east-2'
        const expectedBearer = '  ' 
        let err 
        try {
          await deployAuthorizer(authorizerName, expectedBearer, authorizerRegion)
        } catch (e) {
          err = e
        }

        expect(err).toBeDefined()
      })

      // allow 15 seconds 
      const TIMEOUT = 15 * 1000

      test('runs for valid input, returns ARN on completion', async () => {
        const uuidv4 = require('uuid').v4
        const { deployAuthorizer } = require('./index')
        
        const authorizerName = `jest-deployed-authorizer-${uuidv4()}`
        const authorizerRegion = 'us-east-2' 
        const expectedBearer = 'somelengthyrandombearertoken1234567890'
        let err 
        let res
        try {
          res = await deployAuthorizer(authorizerName, expectedBearer, authorizerRegion)
        } catch (e) {
          err = e
        }

        expect(err).not.toBeDefined()
        expect(typeof res).toBe('string')
      }, TIMEOUT)
    })

    describe('setAuthorizer', () => {
      test('completes when authorizer exists already', () => {
        // TODO
      })
    })
  })
})

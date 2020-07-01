/* eslint-disable global-require */

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const LAMBDANAME = 'jest-reserved-authorizer'
const LAMBDAREGION = 'us-east-2'
const APIREGION = 'us-east-2'
const LAMBDAARN = 'arn:aws:lambda:us-east-2:735406098573:function:jest-reserved-authorizer'

// NOTE Currently convention is one API per endpoint
// Don't extend tests until we are sure of this convention / committed to

describe('authorizer-gen', () => {
  describe('index', () => {
    const BEARERTOKEN = 'somelengthyrandombearertoken1234567890'

    describe('getRouteId', () => {
      test('returns non-empty string for existing route', async () => {
        const getRouteId = require('./index')._only_for_testing_getRouteId

        const apiId = 'vca3i8138h' // first-http-api in my API Gateway
        const routeKey = '$default'

        let err 
        let res 
        try {
          res = await getRouteId(apiId, routeKey, LAMBDAREGION)
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
          res = await getRouteId(apiId, routeKey, LAMBDAREGION)
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
          res = await getRouteId(apiId, routeKey, LAMBDAREGION)
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
        
        const expectedBearer = '123456789  ' 
        const options = {
          region: LAMBDAREGION,
        }
        let err 
        try {
          await deployAuthorizer(LAMBDANAME, expectedBearer, options)
        } catch (e) {
          err = e
        }

        expect(err).toBeDefined()
      })

      test('throws on expectedBearer is null', async () => {
        const { deployAuthorizer } = require('./index')
        
        const expectedBearer = null 
        const options = {
          region: LAMBDAREGION,
        }
        let err 
        try {
          await deployAuthorizer(LAMBDANAME, expectedBearer, options)
        } catch (e) {
          err = e
        }

        expect(err).toBeDefined()
      })
        
      test('throws on expectedBearer is empty string', async () => {
        const { deployAuthorizer } = require('./index')
       
        const expectedBearer = '  ' 
        const options = {
          region: LAMBDAREGION,
        }
        let err 
        try {
          await deployAuthorizer(LAMBDANAME, expectedBearer, options)
        } catch (e) {
          err = e
        }

        expect(err).toBeDefined()
      })

      // allow 15 seconds

      test('completes if authorizer lambda does not exist yet, returns ARN', async () => {
        const { deployAuthorizer } = require('./index')
        const { deleteAmazon } = require('../deployer/amazon/index')
        
        const expectedBearer = BEARERTOKEN
        const options = {
          region: LAMBDAREGION,
        }

        /// //////////////////////////////////////////////
        // Setup: delete authorizer if it exists already

        try {
          await deleteAmazon(LAMBDANAME, LAMBDAREGION)
          // deleted lambda
        } catch (e) {
          if (e.code === 'ResourceNotFoundException') {
            // does not exist in the first place, nice
          } else {
            throw e
          }
        }

        /// ///////////////////////////////////////

        let err 
        let res
        try {
          res = await deployAuthorizer(LAMBDANAME, expectedBearer, options)
        } catch (e) {
          err = e
        }

        expect(err).not.toBeDefined()
        expect(typeof res).toBe('string')
      }, 30 * 1000)

      test('completes if authorizer lambda exists already, returns ARN', async () => {
        const { deployAuthorizer } = require('./index')
        
        const expectedBearer = BEARERTOKEN
        const options = {
          region: LAMBDAREGION,
        }

        /// ///////////////////////////////////////
        // Setup: ensure authorizer lambda exists

        await deployAuthorizer(LAMBDANAME, expectedBearer, options)

        /// ///////////////////////////////////////

        let err 
        let res
        try {
          res = await deployAuthorizer(LAMBDANAME, expectedBearer, options)
        } catch (e) {
          err = e
        }

        expect(err).not.toBeDefined()
        expect(typeof res).toBe('string')
      }, 30 * 1000)
    })

    // allow 15 seconds
    describe('setAuthorizer', () => {
      test('completes when authorizer exists already', async () => {
        const { setAuthorizer } = require('./index')

        const apiId = 'vca3i8138h' // first-http-api in my API Gateway

        let err 
        try {
          await setAuthorizer(apiId, LAMBDAARN, APIREGION)
        } catch (e) {
          err = e
        }

        expect(err).not.toBeDefined()
      }, 15 * 1000)

      test('completes when API has no authorizer yet', async () => {
        const { setAuthorizer } = require('./index')
        const getRouteId = require('./index')._only_for_testing_getRouteId

        /// ////////////////////////////////////////////////
        // Setup: detach current authorizer (if any)
        
        const apiId = 'vca3i8138h' // first-http-api in my API Gateway
        const routeKey = '$default'
        
        const routeId = await getRouteId(apiId, routeKey, LAMBDAREGION)

        // TODO put detach into own function in index.js, that is in turn tested
        const detachCmd = `aws apigatewayv2 update-route --api-id ${apiId} --route-id ${routeId} --authorization-type NONE`
        try {
          await exec(detachCmd, { encoding: 'utf-8' })
          // detached authorizer from $default route
        } catch (e) {
          // API probably does not have authorizer
        }

        /// /////////////////////////////////////////////////
       
        let err 
        try {
          await setAuthorizer(apiId, LAMBDAARN, APIREGION)
        } catch (e) {
          err = e
        }

        expect(err).not.toBeDefined()
        // 
      }, 15 * 1000)

      // TODO test for when authorizer does not exist yet
      /// ////////////////////
    })

    test('throws on authorizerArn not being valid ARN format', async () => {
      const { setAuthorizer } = require('./index')

      const invalidArn = 'INVALID_AMAZON_ARN_FORMAT'
      const apiId = 'vca3i8138h' // first-http-api in my API Gateway

      let err 
      try {
        await setAuthorizer(apiId, invalidArn, APIREGION)
      } catch (e) {
        err = e
      }

      expect(err).toBeDefined()
    }, 15 * 1000)
  })
})

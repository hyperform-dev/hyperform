/* eslint-disable no-await-in-loop, global-require */

// One test to rule them all
// Roughly equivalent to
// (1) $ hf /some/path
// (2) $ curl ENDPOINTS
// (3) Compare output with expected (TODO)
const os = require('os')
const path = require('path')
const fsp = require('fs').promises
const fetch = require('node-fetch')
const uuidv4 = require('uuid').v4
// allow 2 minutes
const TIMEOUT = 2 * 60 * 1000

describe('System tests (takes 1-2 minutes)', () => {
  describe('main', () => {
    test('completes, and echo endpoints return first arg (event) and second arg (http) on GET and POST', async () => {
      const { main } = require('./index')
      /// ////////////////////////////////////////////
      // Set up

      const tmpdir = path.join(
        os.tmpdir(),
        `${Math.ceil(Math.random() * 100000000000)}`,
      )

      // What we will pass to the functions

      const random_string = uuidv4()
      const event_body = {
        random_string,
      }
      const event_querystring = `?random_string=${random_string}`
      
      // Create javascript files

      await fsp.mkdir(tmpdir)
      const code = `
        function irrelevant() {
          return 100
        }
        
        function endpoint_systemtest_echo(event, http) {
          return { event: event, http: http }
        }
        
        module.exports = {
          endpoint_systemtest_echo
        }
        `

      const tmpcodepath = path.join(tmpdir, 'index.js')
      await fsp.writeFile(tmpcodepath, code, { encoding: 'utf-8' })
    
      const dir = tmpdir
      const fnregex = /endpoint/
        
      /// ////////////////////////////////////////////
      // Run main for Amazon
      /// ////////////////////////////////////////////

      let amazonMainRes
      {
        const amazonParsedHyperformJson = {
          amazon: {
            aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
            aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
            aws_default_region: process.env.AWS_REGION,
          },

        }
        const needAuth = false

        let err
        try {
          amazonMainRes = await main(dir, fnregex, amazonParsedHyperformJson, needAuth)
        } catch (e) {
          console.log(e)
          err = e
        }

        // Expect main did not throw
        expect(err).not.toBeDefined()
        // Expect main returned sensible data
        expect(amazonMainRes).toBeDefined()
        expect(amazonMainRes.urls).toBeDefined()
        // // Expect expectedBearer to be defined, since this is an authenticated test
        // expect(amazonMainRes.expectedBearer).toBeDefined()
        // // Conveniently use util method
        // expect(() => ensureBearerTokenSecure(amazonMainRes.expectedBearer)).not.toThrow()
      }
        
      /// ////////////////////////////////////////////
      // Run main for Google
      /// ////////////////////////////////////////////  
      let googleMainRes
      {
        const googleParsedHyperformJson = {
          google: {
            gc_client_email: '',
            gc_private_key: '',
            gc_project: '',
          },

        }
        const needAuth = false

        let err
        try {
          googleMainRes = await main(dir, fnregex, googleParsedHyperformJson, needAuth)
        } catch (e) {
          console.log(e)
          err = e
        }

        // Expect main did not throw
        expect(err).not.toBeDefined()
        // Expect main returned sensible data
        expect(googleMainRes).toBeDefined()
        expect(googleMainRes.urls).toBeDefined()
        // // Expect expectedBearer to be defined, since this is an authenticated test
        // expect(googleMainRes.expectedBearer).toBeDefined()
        // // Conveniently use util method
        // expect(() => ensureBearerTokenSecure(googleMainRes.expectedBearer)).not.toThrow()
      }

      /// ///////////////////////////////////////////
      // Ping each Amazon URL
      // Expect correct result
      /// ///////////////////////////////////////////
      // Don't test Google ones, they take another 1-2min to be ready
      const urls = [].concat(...amazonMainRes.urls)
      // TODO ensure in deployGoogle we return only on truly completed 
      // TODO then, we can start testing them here again
        
      for (let i = 0; i < urls.length; i += 1) {
        const url = urls[i]
        /// /////////////////
        // POST /////////////
        /// /////////////////

        {
          const postres = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(event_body),
          })
          const statusCode = postres.status
          const actualResult = await postres.json()
          // HTTP Code 2XX
          expect(/^2/.test(statusCode)).toBe(true)
          // Echoed event
          expect(actualResult.event).toEqual(event_body)
          // Returned second argument; check if the wrapper formed it properly
          expect(actualResult.http).toBeDefined()
          expect(actualResult.http.headers).toBeDefined()
          expect(actualResult.http.method).toBe('POST')
        }

        /// /////////////////
        // GET /////////////
        /// /////////////////

        {
          const getres = await fetch(`${url}${event_querystring}`, {
            method: 'GET',
          })
          const statusCode = getres.status
          const actualResult = await getres.json()
          // HTTP Code 2XX
          expect(/^2/.test(statusCode)).toBe(true)
          // Echoed event
          expect(actualResult.event).toEqual(event_body)
          // Returned second argument; check if the wrapper formed it properly
          expect(actualResult.http).toBeDefined()
          expect(actualResult.http.headers).toBeDefined()
          expect(actualResult.http.method).toBe('GET')
        }
      }

      // /// /////////////////////////////
      // // Ping each URL without Authorization header
      // // Expect 401 or 403
      // // TODO check more precise ... google weirdly returns 403s here instead of 401

      // // NOTE: had to grant allUsers access in Gcloud console
      // // Thus for google new functions not 100% representative
      // // But we don't test Google currently anyway (see above)
      // for (let i = 0; i < urls.length; i += 1) {
      //   // POST
      //   const url = urls[i]
      //   const res = await fetch(url, {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //   })
      //   const statusCode = res.status
      //   // console.log(`Pinged without Authorization header: ${url}`)
      //   expect([401, 403]).toContain(statusCode)
      // }

      // /// /////////////////////////////
      // // Ping each URL with wrong Authorization header
      // // Expect 403 

      // for (let i = 0; i < urls.length; i += 1) {
      //   // POST 
      //   const url = urls[i]
      //   const res = await fetch(url, {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //       Authorization: 'Bearer XXXXXXXXXNONSENSETOKENXXXXXXX',
      //     },
      //   })
      //   const statusCode = res.status
      //   //   console.log(`Pinged with invalid Authorization header: ${url}`)
      //   expect([403]).toContain(statusCode)
      // }
    }, TIMEOUT)
  })

  describe('cli', () => {
    // TODO
  })
})

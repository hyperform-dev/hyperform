/* eslint-disable no-await-in-loop, global-require */

// One test to rule them all
// (1) Deploy & publish a echo function via Hyperform to Amazon, Google
//     -> The deployment, publishing worked correctly
// (2) Ping it with an event
//     -> The function completes
// (3) Check whether echo is what we expect 
//     -> The in-function wrapper worked correctly

const os = require('os')
const path = require('path')
const fsp = require('fs').promises
const fetch = require('node-fetch')
const uuidv4 = require('uuid').v4

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
        
        function jest_systemtest_echo(event, http) {
          return { event: event, http: http }
        }
        
        module.exports = {
          jest_systemtest_echo
        }
        `

      const tmpcodepath = path.join(tmpdir, 'index.js')
      await fsp.writeFile(tmpcodepath, code, { encoding: 'utf-8' })
    
      const arg1 = tmpdir
      const arg2 = tmpcodepath
      /// ////////////////////////////////////////////
      // Run main for Amazon
      /// ////////////////////////////////////////////
      let amazonMainRes

      {
        const amazonarg3 = {
          amazon: {
            aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
            aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
            aws_default_region: process.env.AWS_REGION,
          },
          
        }
        
        // isPublic
        const amazonarg4 = true
        
        let err
        try {
          amazonMainRes = await main(arg1, arg2, amazonarg3, amazonarg4)
        } catch (e) {
          console.log(e)
          err = e
        }

        // Expect main did not throw
        expect(err).not.toBeDefined()
        // Expect main returned sensible data
        expect(amazonMainRes).toBeDefined()
        expect(amazonMainRes.urls).toBeDefined()
      }
        
      /// ////////////////////////////////////////////
      // Run main for Google
      /// ////////////////////////////////////////////  
      let googleMainRes
      {
        const googlearg3 = {
          google: {
            gc_client_email: '',
            gc_private_key: '',
            gc_project: '',
          },

        }

        // to test publishing too
        const googlearg4 = true
     
        let err
        try {
          googleMainRes = await main(arg1, arg2, googlearg3, googlearg4)
        } catch (e) {
          console.log(e)
          err = e
        }

        // Expect main did not throw
        expect(err).not.toBeDefined()
        // Expect main returned sensible data
        expect(googleMainRes).toBeDefined()
        expect(googleMainRes.urls).toBeDefined()
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
    }, TIMEOUT)
  })

  describe('cli', () => {
    // TODO
  })
})

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

// allow 2 minutes
const TIMEOUT = 2 * 60 * 1000

describe('System tests (takes 1-2 minutes)', () => {
  describe('main', () => {
    describe('authenticated', () => {
      test('completes, and endpoints return expected output when authorized, and 403/401 without and with wrong Bearer', async () => {
        const { main } = require('./index')
        const { ensureBearerTokenSecure } = require('./authorizer-gen/utils')
        /// ////////////////////////////////////////////
        // Set up
  
        const tmpdir = path.join(
          os.tmpdir(),
          `${Math.ceil(Math.random() * 100000000000)}`,
        )
        
        const randomNum = Math.ceil(Math.random() * 100000000000)

        await fsp.mkdir(tmpdir)
        const code = `
        function irrelevant() {
          return 100
        }
        
        function endpoint_systemtest_returnnum() {
          return { num: ${randomNum} }
        }
        
        module.exports = {
          endpoint_systemtest_returnnum
        }
        `
        
        const tmpcodepath = path.join(tmpdir, 'index.js')
        await fsp.writeFile(tmpcodepath, code, { encoding: 'utf-8' })
        
        // const tmpjsonpath = path.join(tmpdir, 'hyperform.json')
        // await fsp.writeFile(tmpjsonpath, json, { encoding: 'utf-8' })
        
        /// ////////////////////////////////////////////
        // Run
        
        const dir = tmpdir
        const fnregex = /endpoint/
        const parsedHyperformJson = {
          amazon: {
            aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
            aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY, 
            aws_default_region: process.env.AWS_REGION, 
          },
          google: {
            gc_client_email: '',
            gc_private_key: '',
            gc_project: '',
          },
        }
        const needAuth = true
  
        let mainres 
        let err 
        try {
          mainres = await main(dir, fnregex, parsedHyperformJson, needAuth)
        } catch (e) {
          console.log(e)
          err = e
        }
  
        // Expect main did not throw
        expect(err).not.toBeDefined()
        // Expect main returned sensible data
        expect(mainres).toBeDefined()
        expect(mainres.urls).toBeDefined()
        // Expect expectedBearer to be defined, since this is an authenticated test
        expect(mainres.expectedBearer).toBeDefined()
        // Conveniently use util method
        expect(() => ensureBearerTokenSecure(mainres.expectedBearer)).not.toThrow()

        /// /////////////////////////////
        // Ping each URL with correct bearer token
        // Expect correct result
        const expectedResult = { num: randomNum }
        let urls = [].concat(...mainres.urls)
        // Don't test Google ones, they take another 1-2min to be ready
        // TODO ensure in deployGoogle we return only on truly completed 
        // TODO then, we can start testing them here again
        urls = urls.filter((u) => /cloudfunctions/.test(u) === false)
        for (let i = 0; i < urls.length; i += 1) {
          // POST
          const url = urls[i]
          const res = await fetch(url, { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${mainres.expectedBearer}`,
            },
          })
          const statusCode = res.status 
          const actualResult = await res.json()
          // HTTP Code 2XX
          expect(/^2/.test(statusCode)).toBe(true)
          // Returned correct object
          expect(actualResult).toEqual(expectedResult)
        }

        /// /////////////////////////////
        // Ping each URL without Authorization header
        // Expect 401 or 403
        // TODO check more precise ... google weirdly returns 403s here instead of 401

        // NOTE: had to grant allUsers access in Gcloud console
        // Thus for google new functions not 100% representative
        // But we don't test Google currently anyway (see above)
        for (let i = 0; i < urls.length; i += 1) {
          // POST
          const url = urls[i]
          const res = await fetch(url, { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          const statusCode = res.status 
          // console.log(`Pinged without Authorization header: ${url}`)
          expect([401, 403]).toContain(statusCode)
        }

        /// /////////////////////////////
        // Ping each URL with wrong Authorization header
        // Expect 403 

        for (let i = 0; i < urls.length; i += 1) {
          // POST 
          const url = urls[i]
          const res = await fetch(url, { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer XXXXXXXXXNONSENSETOKENXXXXXXX',
            },
          })
          const statusCode = res.status 
          //   console.log(`Pinged with invalid Authorization header: ${url}`)
          expect([403]).toContain(statusCode)
        }
      }, TIMEOUT)
    })
  })

  describe('cli', () => {
    // TODO
  })
})

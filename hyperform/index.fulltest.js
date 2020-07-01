/* eslint-disable no-await-in-loop */

// One test to rule them all
// Roughly equivalent to
// (1) $ hyperform /some/path
// (2) $ curl ENDPOINTS
// (3) Compare output with expected
const os = require('os')
const path = require('path')
const fsp = require('fs').promises
const util = require('util')
const fetch = require('node-fetch')
// function hook_stdout(callback) {
//     var old_write = process.stdout.write

//     process.stdout.write = (function(write) {
//         return function(string, encoding, fd) {
//             write.apply(process.stdout, arguments)
//             callback(string, encoding, fd)
//         }
//     })(process.stdout.write)

//     return function() {
//         process.stdout.write = old_write
//     }
// }

// allow 2 minutes
const TIMEOUT = 2 * 60 * 1000

describe('System tests (takes 1-2 minutes)', () => {
  describe('main', () => {
    test('runs without errors, and resulting endpoints 403 without Bearer token', async () => {
      const { main } = require('./index')

      /// ////////////////////////////////////////////
      // Set up

      const tmpdir = path.join(
        os.tmpdir(),
        `${Math.ceil(Math.random() * 100000000000)}`,
      )
      const tmppath = path.join(tmpdir, 'index.js')

      await fsp.mkdir(tmpdir)
      const code = `
          function irrelevant() {
            return 100
          }

          function endpoint_testhello() {
            return { z: 0 }
          }

          module.exports = {
            endpoint_testhello
          }
        `

      await fsp.writeFile(tmppath, code, { encoding: 'utf-8' })

      /// ////////////////////////////////////////////
      // Run

      const dir = tmpdir
      const fnregex = /endpoint_/

      let mainres 
      let err 
      try {
        mainres = await main(dir, fnregex)
      } catch (e) {
        err = e
      }

      // Expect it did not throw
      expect(err).not.toBeDefined()

      /// ////////////////////////////////////////////////

      // NOTE: had to grant allUsers access in Gcloud console
      // Thus for google new functions not 100% representative

      // Expect endpoints return 401 or 403 when no Authorization header
      // TODO check more precise ... google weirdly returns 403s here instead of 401
      const urls = [].concat(...mainres)
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

      /// ////////////////////////////////////////////////
      
      // Expect endpoints return  403 when invalid Authorization header 

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

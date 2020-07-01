const GCFREGION = 'us-central1'

describe('deployer', () => {
  describe('google', () => {
    describe('deployGoogle', () => {
      // Google does not reliably complete deploy/delete at returning
      // Therefore you can't really setup it properly 
      // because setup might overlap with the test itself

      test('completes, and returns an URL', async () => {
        // Google does not differentiate between deploy and update anyway, 
        // so this should be okay-ish representative

        const { deployGoogle } = require('./index')
        const path = require('path')
        const fsp = require('fs').promises
        const os = require('os')
        const uuidv4 = require('uuid').v4

        /// //////////////////////////////////////////////
        // Setup: create folder with code

        const name = 'jest_reserved_deployer_test_A'
        const code = `module.exports = { ${name}: () => ({a: 1}) }`

        const tmpdir = path.join(
          os.tmpdir(),
          uuidv4(),
        )
        await fsp.mkdir(tmpdir)
        // write code to there as file
        await fsp.writeFile(
          path.join(tmpdir, 'index.js'),
          code,
          { encoding: 'utf-8' },
        )

        /// ////////////////////////////////////////////////////

        const options = {
          name: name,
          stagebucket: 'jak-functions-stage-bucket',
          region: GCFREGION,
        }
        
        let err
        let googleUrl
        try {
          googleUrl = await deployGoogle(tmpdir, options)
        } catch (e) {
          err = e
        }

        // it completed 
        expect(err).not.toBeDefined()

        // it's an URL 
        const tryUrl = () => new URL(googleUrl)
        expect(tryUrl).not.toThrow()
      }, 2 * 60 * 1000)
    })
  })
})

describe('deployer', () => {
  describe('google', () => {
    describe('deployGoogle', () => {

      // allow 15 seconds
      test('completes if GCF already exists, and returns an URL', async () => {
        const { deployGoogle } = require('./index')
        const path = require('path')
        const fsp = require('fs').promises
        const os = require('os')
        const uuidv4 = require('uuid').v4

        /// //////////////////////////////////////////////
        // Setup: create folder with code

        const name = 'jest_reserved_returna'
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

        // fetching URL returns 401 or 403

      }, 2 * 60 * 1000)


    })
  })
})
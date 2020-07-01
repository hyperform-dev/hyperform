const GCFREGION = 'us-central1'
const GCFPROJECT = 'firstnodefunc'
const GCFRUNTIME = 'nodejs12'

describe('deployer', () => {
  describe('google', () => {
    describe('deployGoogle', () => {
      // Google does not reliably complete deploy/delete at returning
      // Therefore you can't really setup it properly 
      // because setup might overlap with the test itself

      test('completes if GCF exists already, and returns an URL', async () => {
        const { deployGoogle } = require('./index')
        const { zip } = require('../../zipper/index')

        /// //////////////////////////////////////////////
        // Setup: create folder with code

        /// //////////////////////////////////////////////
        // Setup: create code zip
        
        const name = 'jest_reserved_deployGoogle_A'
        const code = `module.exports = { ${name}: () => ({a: 1}) }`
        const zipPath = await zip(code)

        /// ////////////////////////////////////////////////////

        const options = {
          name: name,
          project: GCFPROJECT,
          region: GCFREGION,
          runtime: GCFRUNTIME, 
        }
        
        let err
        let res
        try {
          res = await deployGoogle(zipPath, options)
        } catch (e) {
          console.log(e)
          err = e
        }

        // it completed 
        expect(err).not.toBeDefined()

        // it's an URL 
        const tryUrl = () => new URL(res)
        expect(tryUrl).not.toThrow()
        // Note: the URL would then take another 1-2 minutes to point to a proper GCF
      }, 2 * 60 * 1000)
    })

    describe('isExistsGoogle', () => {
      test('true on existing function in project, region', async () => {
        const isExistsGoogle = require('./index')._only_for_testing_isExistsGoogle

        const input = {
          name: 'endpoint_oho', // TODO make reserved funcs for tests
          project: GCFPROJECT,
          region: GCFREGION,
        }

        let err 
        let res 
        try {
          res = await isExistsGoogle(input)
        } catch (e) {
          err = e
        }

        expect(err).not.toBeDefined()
        expect(res).toEqual(true)
      })

      test('false on non-existing function in project, region', async () => {
        const isExistsGoogle = require('./index')._only_for_testing_isExistsGoogle

        const input = {
          name: 'SOME_NONEXISTING_FUNCTION_0987654321', // TODO make reserved funcs for tests
          project: GCFPROJECT,
          region: GCFREGION,
        }

        let err 
        let res 
        try {
          res = await isExistsGoogle(input)
        } catch (e) {
          err = e
        }

        // should still not throw
        expect(err).not.toBeDefined()
        expect(res).toEqual(false)
      })
    })
  })
})

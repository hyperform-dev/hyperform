const uuidv4 = require('uuid').v4 
const fsp = require('fs').promises
const path = require('path')
const os = require('os')
const { runDo } = require('./index')

describe('runDo', () => {
  describe('throws on invalid params', () => {
    test('path is a file (no ext)', async () => {
      // setup 
      const tmpfilepath = path.join(
        os.tmpdir(),
        uuidv4(), // without extension
      )

      await fsp.writeFile(tmpfilepath, 'filecontentsxxx')
      
      const toBeTested = () => runDo(tmpfilepath, 'npm i', 'hint')

      // workaround to detect async throws
      let err = null 
      try {
        await toBeTested()
      } catch (e) {
        err = e
      }

      expect(err).toBeDefined()
    })

    test('path is a file (.txt ext)', async () => {
      // setup 
      const tmpfilepath = path.join(
        os.tmpdir(),
        `${uuidv4()}.txt`,
      )

      await fsp.writeFile(tmpfilepath, 'filecontentsxxx')
      
      const toBeTested = () => runDo(tmpfilepath, 'npm i', 'hint')

      // workaround to detect async throws
      let err = null 
      try {
        await toBeTested()
      } catch (e) {
        err = e
      }

      expect(err).toBeDefined()
    })
  })

  describe('throws if "do" script fails', () => {
    test('non-zero exit code', async () => {
      // setup 
      const tmpdirpath = path.join(
        os.tmpdir(),
        uuidv4(),
      )
      // technially a valid path
      await fsp.mkdir(tmpdirpath)

      const toBeTested = () => runDo(tmpdirpath, 'echo "x"; exit 1;', 'hint')
     
      // workaround to detect async throws
      let err = null 
      try {
        await toBeTested()
      } catch (e) {
        err = e
      }

      expect(err).toBeDefined()
    })
  })
})

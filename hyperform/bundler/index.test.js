const fsp = require('fs').promises
const os = require('os')
const path = require('path')
const uuidv4 = require('uuid').v4 
const { bundle } = require('./index')

describe('bundler', () => {
  test('does not throw on empty js file & returns string', async () => {
    const tmpd = await fsp.mkdtemp(path.join(os.tmpdir(), 'bundle-'))
    const inpath = path.join(tmpd, 'index.js')
    const filecontents = ' '
    await fsp.writeFile(inpath, filecontents)

    let err;
    let res
    try {
      res = await bundle(inpath, 'js', 'amazon')
    } catch (e) {
      console.log(e)
      err = e
    }

    expect(err).not.toBeDefined()
    expect(typeof res === 'string').toBe(true)
  })

  test('does not throw on js file & returns string', async () => {
    const tmpd = await fsp.mkdtemp(path.join(os.tmpdir(), 'bundle-'))
    const code = 'module.exports.inc = (x) => x + 1'
    const inpath = path.join(tmpd, 'index.js')
      
    await fsp.writeFile(inpath, code)

    let err;
    let res
    try {
      res = await bundle(inpath, 'js', 'amazon')
    } catch (e) {
      console.log(e)
      err = e
    }

    expect(err).not.toBeDefined()
    expect(typeof res === 'string').toBe(true)
  })

  test('throws on invalid input path', async () => {
    const code = 'module.exports.inc = (x) => x + 1'
    const invalidinpath = path.join(os.tmpdir(), `surely-this-path-does-not-exist-${uuidv4()}`)
    
    let err;
    let res
    try {
      res = await bundle(invalidinpath, 'js', 'amazon')
      console.log(res)
    } catch (e) {
      console.log(e)
      err = e
    }

    expect(err).toBeDefined()
  })
})

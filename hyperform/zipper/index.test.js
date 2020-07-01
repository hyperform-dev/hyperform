describe('zipper', () => {
  test('completes and returns valid path', async () => {
    const path = require('path')
    const fs = require('fs')
    const { zip } = require('./index')
    const code = 'module.exports = () => { }'
    let err
    let res 
    try {
      res = await zip(code)
    } catch (e) {
      err = e
    }

    expect(err).not.toBeDefined()

    // expect it's a path 
    // https://stackoverflow.com/a/38974272
    expect(res === path.basename(res)).toBe(false)

    // expect it ends with '.zip'
    expect(path.extname(res)).toBe('.zip')

    // expect we can get details about it
    let statErr  
    try {
      fs.statSync(res)
    } catch (e) {
      statErr = e
    }

    expect(statErr).not.toBeDefined()
  })
})

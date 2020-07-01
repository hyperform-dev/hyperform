const { amazonQuery } = require('./index')
const { Namecache } = require('../../namecache/index')

describe('amazon resolver', () => {
  describe('known names', () => {
    test('given lambda arn, returns it', async () => {
      const input = 'arn:aws:lambda:us-east-2:735406098573:function:myinc'
      const namecache = new Namecache()

      const toBeTested = () => amazonQuery(input, namecache)

      const res = await toBeTested()

      expect(/^arn/.test(res)).toBe(true)
    })

    test('given existing lambda name, returns arn', async () => {
      const input = 'myinc'
      const namecache = new Namecache()

      const toBeTested = () => amazonQuery(input, namecache)

      const res = await toBeTested()

      expect(/^arn/.test(res)).toBe(true)
    })
  })

  describe('unknown names', () => {
    // NOTE this would be a fundamental progamming error on our side
    // it should behave as with any other invalid or non-existing name - return null

    // test('given s3 arn, throws', async () => {
    //   const input = 'arn:aws:s3:::this-is-a-bucket-xweoginewg'

    //   const toBeTested = () => amazonQuery(input)

    //   let err 
    //   try {
    //     const res = await toBeTested()
    //   } catch (e) {
    //     err = e
    //   }

    //   expect(err).toBeDefined()
    // })

    test('given unknown lambda name, returns null', async () => {
      const input = 'my-nonexisting-lambda'
      const namecache = new Namecache()

      const toBeTested = () => amazonQuery(input, namecache)

      let err 
      let res 
      try {
        res = await toBeTested()
      } catch (e) {
        err = e
      }

      expect(res).toBe(null)
    })
  })
})

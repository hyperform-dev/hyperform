const { amazonQuery } = require('./index')

describe('amazon resolver', () => {
  describe('known names', () => {
    test('given lambda arn, returns it', async () => {
      const input = 'arn:aws:lambda:us-east-2:735406098573:function:myinc'

      const toBeTested = () => amazonQuery(input)

      const res = await toBeTested()

      expect(/^arn/.test(res)).toBe(true)
    })

    test('given existing lambda name, returns arn', async () => {
      const input = 'myinc'

      const toBeTested = () => amazonQuery(input)

      const res = await toBeTested()

      expect(/^arn/.test(res)).toBe(true)
    })
  })

  describe('unknown names', () => {
    test('given s3 arn, throws', async () => {
      const input = 'arn:aws:s3:::this-is-a-bucket-xweoginewg'

      const toBeTested = () => amazonQuery(input)

      let err 
      try {
        const res = await toBeTested()
      } catch (e) {
        err = e
      }

      expect(err).toBeDefined()
    })

    test('given unknown lambda name, throws', async () => {
      const input = 'my-nonexisting-lambda'

      const toBeTested = () => amazonQuery(input)

      let err 
      try {
        const res = await toBeTested()
      } catch (e) {
        err = e
      }

      expect(err).toBeDefined()
    })
  })
})

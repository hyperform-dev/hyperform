const { amazonEnvoy } = require('./index')

describe('amazonEnvoy', () => {
  describe('canEnvoy', () => {
    describe('cases where it should claim canEnvoy', () => {
      test('ARN (function)', async () => {
        const input = 'arn:aws:lambda:us-east-2:735406098573:function:myinc'
        const toBeTested = () => amazonEnvoy.canEnvoy(input)

        const res = await toBeTested()

        expect(res).toEqual(true)
      })
    })

    describe('cases where it should not claim canEnvoy', () => {
      test('Ambiguous name', async () => {
        // (Keep name resolving out of canEnvoy, it should only do a simple regex )
        const input = 'myinc'
        const toBeTested = () => amazonEnvoy.canEnvoy(input)

        const res = await toBeTested()

        expect(res).toEqual(false)
      })

      test('ARN (s3 bucket)', async () => {
        const input = 'arn:aws:s3:::this-is-a-bucket-xweoginewg'
        const toBeTested = () => amazonEnvoy.canEnvoy(input)

        const res = await toBeTested()

        expect(res).toEqual(false)
      })
    })
  })

  // TODO will these fail in ci? IE are the lambdas public?
  describe('envoy', () => {
    describe('fns that should complete successfully', () => {
      test('envoy succeeds, returns parsed object, not string', async () => {
        const input = { num: 1 }
        const name = 'arn:aws:lambda:us-east-2:735406098573:function:myinc'
        const toBeTested = () => amazonEnvoy.envoy(name, input)

        const res = await toBeTested()
        expect(typeof res).toEqual('object')
      })
    })

    describe('fns that should throw', () => {
      test('envoy throws on fn throw', async () => {
        const input = { num: 1 }
        const name = 'arn:aws:lambda:us-east-2:735406098573:function:mythrow'
        const toBeTested = () => amazonEnvoy.envoy(name, input)

        let err 
        try {
          await toBeTested()
        } catch (e) {
          err = e
        }

        expect(err).toBeDefined()
      })
    })
  })
})

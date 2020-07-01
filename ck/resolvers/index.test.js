const { resolveName } = require('./index')
const { Namecache } = require('../namecache/index')

describe('resolvers', () => {
  describe('amazonian names', () => {
    describe('resolves correctly', () => {
      test('plain name 1', async () => {
        const input = 'myinc'
        const namecache = new Namecache()
        const expectedOutput = 'arn:aws:lambda:us-east-2:735406098573:function:myinc'

        const toBeTested = () => resolveName(input, namecache)

        const res = await toBeTested()
        expect(res).toBe(expectedOutput)
      })

      test('plain name 2', async () => {
        const input = 'myincinc'
        const namecache = new Namecache()

        const expectedOutput = 'arn:aws:lambda:us-east-2:735406098573:function:myincinc'

        const toBeTested = () => resolveName(input, namecache)

        const res = await toBeTested()
        expect(res).toBe(expectedOutput)
      })

      test('arn', async () => {
        const input = 'arn:aws:lambda:us-east-2:735406098573:function:myinc'
        const namecache = new Namecache()

        const expectedOutput = 'arn:aws:lambda:us-east-2:735406098573:function:myinc'

        const toBeTested = () => resolveName(input, namecache)

        const res = await toBeTested()
        expect(res).toBe(expectedOutput)
      })

      test('TEST FORMAT negative test', async () => {
        const input = 'arn:aws:lambda:us-east-2:735406098573:function:myinc'
        const namecache = new Namecache()

        const expectedOutput = 'xxxxxxxxxxxxxx'

        const toBeTested = () => resolveName(input, namecache)

        const res = await toBeTested()
        expect(res).not.toBe(expectedOutput)
      })
    })

    describe('throws', () => {
      test('unknown name', async () => {
        const input = 'non_existing_function_xweougbwgiouwngowignoeiw'
        
        const toBeTested = () => resolveName(input)

        let err
        try {
          const _ = await toBeTested()
        } catch (e) {
          err = e
        }

        expect(err).toBeDefined()
      })
    })
  })
})

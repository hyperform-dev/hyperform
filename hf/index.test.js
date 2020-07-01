const { Hyperform } = require('./index')

describe('Hyperform class', () => {
  describe('correct computation', () => {
    describe('1 step', () => {
      test('simple inc', async () => {
        const hf = new Hyperform()

        /**
         * { a: 1 }
         */
        hf.b({
          a: ({ a }) => a + 1,
        })

        const toBeTested = () => hf.r({
          a: 1,
        })

        const res = await toBeTested()
        expect(res).toStrictEqual({ a: 2 })
      })

      test('heavily nested, all kinds of types', async () => {
        const hf = new Hyperform()

        const input = {
          a: 'xxx',
          b: {
            c: {
              d: [1, 2, 3],
              x: new Date(100),
              y: new String('abc'),
              e: {},
              f: 1,
            },
          },
        }

        const expectedOutput = {
          a: 'xxx',
          b: {
            c: {
              d: [1, 2, 3],
              x: new Date(100),
              y: new String('abc'),
              e: {},
              f: 2,
            },
          },
        }

        hf.b({
          b: {
            c: {
              f: (prev) => prev.b.c.f + 1,
            },
          },
        })

        const toBeTested = () => hf.r(input)

        const res = await toBeTested()
        expect(res).toStrictEqual(expectedOutput)
      })

      test('create new fields', async () => {
        const hf = new Hyperform()

        const input = {

        }

        const expectedOutput = {
          a: {
            b: {
              c: [1, 2, 3],
            },
          },
        }

        hf.b({
          a: {
            b: {
              c: [1, 2, 3],
            },
          },
        })

        const toBeTested = () => hf.r(input)

        const res = await toBeTested()
        expect(res).toStrictEqual(expectedOutput)
      })

      test('async functions', async () => {
        const hf = new Hyperform()

        const input = {
          a: {
            b: 1,
          },
        }

        const expectedOutput = {
          a: {
            b: 2,
          },
        }

        hf.b({
          a: {
            b: (prev) => new Promise((resolve) => {
              setTimeout(() => {
                const num = prev.a.b
                resolve(num + 1)
              }, 200);
            }),
          },
        })

        const toBeTested = () => hf.r(input)

        const res = await toBeTested()
        expect(res).toStrictEqual(expectedOutput)
      })
    })

    describe('many steps', () => {
      test('simple inc inc', async () => {
        const hf = new Hyperform()

        const input = {
          a: 1,
        }

        const expectedOutput = {
          a: 3,
        }

        hf.b({
          a: ({ a }) => a + 1,
        })

        hf.b({
          a: ({ a }) => a + 1,
        })

        const toBeTested = () => hf.r(input)

        const res = await toBeTested()
        expect(res).toStrictEqual(expectedOutput)
      })

      test('correct order (string concat)', async () => {
        const hf = new Hyperform()

        const input = {
          str: '',
        }

        const expectedOutput = {
          str: 'abc',
        }

        hf.b({
          str: ({ str }) => `${str}a`,
        })

        hf.b({
          str: ({ str }) => `${str}b`,
        })

        hf.b({
          str: ({ str }) => `${str}c`,
        })

        const toBeTested = () => hf.r(input)

        const res = await toBeTested()
        expect(res).toStrictEqual(expectedOutput)
      })

      test('setting primitives to falsy things: null, undefined, ...', async () => {
        const hf = new Hyperform()

        const input = {
          a: 1,
          b: 1,
          c: {
            d: 1,
          },
        }

        const expectedOutput = {
          a: null,
          b: undefined,
          c: {
            d: false,
          },
        }

        hf.b({
          a: null,
        })

        hf.b({
          b: undefined,
        })

        hf.b({
          c: {
            d: false,
          },
        })

        const toBeTested = () => hf.r(input)

        const res = await toBeTested()
        expect(res).toStrictEqual(expectedOutput)
      })

      test('setting primitives to empty things: {}, [] ....', async () => {
        const hf = new Hyperform()

        const input = {
          a: {
            b: 1,
          },
          c: {
            d: 1,
          },
        }

        const expectedOutput = {
          a: {
            b: {},
          },
          c: {
            d: [],
          },
        }

        hf.b({
          a: {
            b: {},
          },
        })

        hf.b({
          c: {
            d: [],
          },
        })

        const toBeTested = () => hf.r(input)

        const res = await toBeTested()
        expect(res).toStrictEqual(expectedOutput)
      })
    })
  })

  describe('throws on invalid stuff', () => {
    test('modifying hf after running it', async () => {
      const hf = new Hyperform()

      const input = { a: 1 }

      const expectedOutput = { a: 1 }

      hf.b({ a: 1 })
      await hf.r(input)

      const toBeTested = () => hf.b({ a: 1 })
      expect(toBeTested).toThrow()
    })
  })
})

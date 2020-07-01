/* eslint-disable global-require */
describe('validators', () => {
  describe('validateInput', () => {
    const { validateInput } = require('./index')
    describe('accepts valid', () => {
      test('obj', () => {
        const input = { 
          a: 1,
        }
        const toBeTested = () => validateInput(input)
        expect(toBeTested).not.toThrow()
      })

      test('nested obj', () => {
        const input = {
          a: 1,
          b: {
            c: 1,
          },
        }
        const toBeTested = () => validateInput(input)
        expect(toBeTested).not.toThrow()
      })

      test('obj with arrays, objects, ...', () => {
        const input = {
          a: 1,
          b: new Date(100),
          c: new String('ayaa'),
        }
        const toBeTested = () => validateInput(input)
        expect(toBeTested).not.toThrow()
      })

      test('empty obj', () => {
        const input = {}
        const toBeTested = () => validateInput(input)
        expect(toBeTested).not.toThrow()
      })
    })
    describe('throws on invalid', () => {
      test('null', () => {
        const input = null 
        const toBeTested = () => validateInput(input)
        expect(toBeTested).toThrow()
      })

      test('undefined', () => {
        const input = undefined 
        const toBeTested = () => validateInput(input)
        expect(toBeTested).toThrow()
      })

      test('array', () => {
        const input = [1, 2, 3] 
        const toBeTested = () => validateInput(input)
        expect(toBeTested).toThrow()
      })

      test('function', () => {
        const input = () => { }
        const toBeTested = () => validateInput(input)
        expect(toBeTested).toThrow()
      })

      describe('primitives', () => {
        test('number', () => {
          const input = 1
          const toBeTested = () => validateInput(input)
          expect(toBeTested).toThrow()
        })
       
        test('string', () => {
          const input = 'input'
          const toBeTested = () => validateInput(input)
          expect(toBeTested).toThrow()
        })

        test('boolean', () => {
          const input = 1
          const toBeTested = () => validateInput(input)
          expect(toBeTested).toThrow()
        })
      })
      // allow passing something like new Date()
      // it is a bit nonsensical but it does work as input 
      // it is checked for functions (see tests below) so no concerns

      // test('date (technically object)', () => {
      //   const input = new Date(100) 
      //   const toBeTested = () => validateInput(input)
      //   expect(toBeTested).toThrow()
      // })

      test('has function fields', () => {
        const input = {
          a: () => { },
        }
        const toBeTested = () => validateInput(input)
        expect(toBeTested).toThrow()
      })

      test('has very nested function fields', () => {
        const input = {
          a: {
            b: {
              c: {
                d: () => {},
              },
            },
          },
        }
        const toBeTested = () => validateInput(input)
        expect(toBeTested).toThrow()
      })
    })
  })

  describe('validateStep', () => {
    const { validateStep } = require('./index')
    describe('accepts valid', () => {
      test('obj', () => {
        const input = { 
          a: 1,
        }
        const toBeTested = () => validateStep(input)
        expect(toBeTested).not.toThrow()
      })

      test('nested obj', () => {
        const input = {
          a: 1,
          b: {
            c: 1,
          },
        }
        const toBeTested = () => validateStep(input)
        expect(toBeTested).not.toThrow()
      })

      test('obj with arrays, objects, ...', () => {
        const input = {
          a: 1,
          b: new Date(100),
          c: new String('ayaa'),
        }
        const toBeTested = () => validateStep(input)
        expect(toBeTested).not.toThrow()
      })

      test('empty obj', () => {
        const input = {}
        const toBeTested = () => validateStep(input)
        expect(toBeTested).not.toThrow()
      })

      // function fields are allowed/encouraged in steps
      test('function fields', () => {
        const input = {
          a: () => { },
        }
        const toBeTested = () => validateStep(input)
        expect(toBeTested).not.toThrow()
      })
    })
    describe('throws on invalid', () => {
      test('null', () => {
        const input = null 
        const toBeTested = () => validateStep(input)
        expect(toBeTested).toThrow()
      })

      test('undefined', () => {
        const input = undefined 
        const toBeTested = () => validateStep(input)
        expect(toBeTested).toThrow()
      })

      test('array', () => {
        const input = [1, 2, 3] 
        const toBeTested = () => validateStep(input)
        expect(toBeTested).toThrow()
      })

      test('function', () => {
        const input = () => { }
        const toBeTested = () => validateStep(input)
        expect(toBeTested).toThrow()
      })
    })
  })
})

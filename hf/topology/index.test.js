describe('topology', () => {
  test('is square', () => {
    const topology = require('./index').__only_for_testing_topology

    const collen = topology.length
    for (let i = 0; i < topology.length; i += 1) {
      const rowlen = (topology[i]).length
      expect(rowlen).toBe(collen)
    } 
  })

  describe('roundtripCost', () => {
    test('same region is cost 0', () => {
      const { roundtripCost } = require('./index')

      const fn1 = 'arn:aws:lambda:us-east-2:735406098573:function:myinc'
      const fn2 = 'arn:aws:lambda:us-east-2:735406098573:function:myincinc'

      const toBeTested = () => roundtripCost(fn1, fn2)
      const res = toBeTested()
      expect(res).toBe(0)
    })
  })

  // describe('some popular regions exist', () => {
  //   test('amazon/us-east-2', () => {
  //     const { roundtripCost } = require('./index')
  //     const region = 'amazon/us-east-2'
  //     const toBeTested = () => roundtripCost(region, region)

  //     expect(toBeTested).not.toThrow()
  //   })
  // })

  // describe('throws on unknown region or provider', () => {
  //   test('amazon/us-space-1', () => {
  //     const { roundtripCost } = require('./index')
  //     const region = 'amazon/us-space-1'
  //     const toBeTested = () => roundtripCost(region, region)

  //     expect(toBeTested).toThrow()
  //   })

  //   test('rapture/under-sea-1', () => {
  //     const { roundtripCost } = require('./index')
  //     const region = 'rapture/under-sea-1'
  //     const toBeTested = () => roundtripCost(region, region)

  //     expect(toBeTested).toThrow()
  //   })

  //   test('rapture/us-east-2', () => {
  //     const { roundtripCost } = require('./index')
  //     const region = 'rapture/us-east-2'
  //     const toBeTested = () => roundtripCost(region, region)

  //     expect(toBeTested).toThrow()
  //   })
  // })
})

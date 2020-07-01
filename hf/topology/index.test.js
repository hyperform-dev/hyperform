describe('topology', () => {
  test('is square', () => {
    const topology = require('./index').__only_for_testing_topology

    const collen = topology.length
    for (let i = 0; i < topology.length; i += 1) {
      const rowlen = (topology[i]).length
      expect(rowlen).toBe(collen)
    } 
  })

  describe('getCost', () => {
    test('same region is cost 0', () => {
      const regionsToIdx = require('./index').__only_for_testing_regionsToIdx
      const { getCost } = require('./index')

      const regions = Object.keys(regionsToIdx)

      const toBeTested = (region) => getCost(region, region)

      for (let i = 0; i < regions.length; i += 1) {
        const fromto = regions[i]
        const cost = toBeTested(fromto)
        expect(cost).toBe(0)
      }
    })
  })

  // describe('some popular regions exist', () => {
  //   test('amazon/us-east-2', () => {
  //     const { getCost } = require('./index')
  //     const region = 'amazon/us-east-2'
  //     const toBeTested = () => getCost(region, region)

  //     expect(toBeTested).not.toThrow()
  //   })
  // })

  // describe('throws on unknown region or provider', () => {
  //   test('amazon/us-space-1', () => {
  //     const { getCost } = require('./index')
  //     const region = 'amazon/us-space-1'
  //     const toBeTested = () => getCost(region, region)

  //     expect(toBeTested).toThrow()
  //   })

  //   test('rapture/under-sea-1', () => {
  //     const { getCost } = require('./index')
  //     const region = 'rapture/under-sea-1'
  //     const toBeTested = () => getCost(region, region)

  //     expect(toBeTested).toThrow()
  //   })

  //   test('rapture/us-east-2', () => {
  //     const { getCost } = require('./index')
  //     const region = 'rapture/us-east-2'
  //     const toBeTested = () => getCost(region, region)

  //     expect(toBeTested).toThrow()
  //   })
  // })
})

const { sharedNamecache } = require('./index')

describe('namecache', () => {
  test('get, put, getall', () => {
    // put
    sharedNamecache.put('akey', 'aval')
    // get
    expect(sharedNamecache.get('akey')).toBe('aval')
    // getall
    expect(sharedNamecache.getall()).toEqual({ akey: 'aval' })
  })
})

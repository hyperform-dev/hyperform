// shared name cache  

class Namecache {
  constructor() {
    this.namecache = {}
  }

  put(key, value) {
    this.namecache[key] = value 
  }

  /**
   * @returns {*|Promise<*>} Returns the value, or a promise thereof
   * @param {string} key 
   */
  get(key) {
    if (typeof key !== 'string') {
      throw new Error(`namecache: get key must be string, but is ${key}`)
    }

    return this.namecache[key]
  }

  getall() {
    return this.namecache
  }
}

const sharedNamecache = new Namecache()

module.exports = {
  sharedNamecache,
  Namecache,
}

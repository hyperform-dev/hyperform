class Stash {
  constructor() {
    this.stash = {}
  }

  /**
   * 
   * @param {string} key 
   * @param {*} value 
   */
  put(key, value) {
    this.stash[key] = value
  }

  /**
   * 
   * @param {string | string[]} key Key or arbitrarily nested array of keys
   */
  get(key) {
    if (typeof key !== 'string' && key.length == null) {
      throw new Error(`stash: get key must be stirng or array, but is ${key}`)
    }

    // key is string
    if (typeof key === 'string') {
      if (this.stash[key] === undefined) {
        throw new Error(`stash: get: key ${key} was never set`)
      }
      return this.stash[key]
    } else {
      // key is array or nested array
      // recursion boii
      return key.map((el) => this.get(el))
    }
  }

  getall() {
    return this.stash
  }
}

const sharedStash = new Stash()

module.exports = {
  sharedStash,
}

// shared name cache  

class Namecache {
  constructor() {
    this.namecache = {}
    this.costs = {}
    this.callbacks = {}
  }

  put(key, value) {
    this.namecache[key] = value 
    // if listener is registered for that key, call it
    if (this.callbacks[key] != null) {
      this.callbacks[key](key, value)
    }
  }

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

class Stash {
  constructor() {
    this.stash = {}
  }

  put(key, value) {
    console.log('Put ', key, value)

    this.stash[key] = value
  }

  get(key) {
    console.log('Get ', key)
    if (this.stash[key] === undefined) {
      throw new Error(`stash: key ${key} was never set`)
    }
    return this.stash[key]
  }

  getall() {
    return this.stash
  }
}

module.exports = {
  Stash,
}

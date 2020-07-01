class Stash {
  constructor() {
    this.stash = {}
  }

  put(key, value) {
    this.stash[key] = value
  }

  get(key) {
    if (this.stash[key] === undefined) {
      throw new Error(`stash: key ${key} was never set`)
    }
  }
}

module.exports = {
  Stash,
}

module.exports = {
  a: () => console.log(a)
}

const Module = require('module')

const mod = new Module('./itself')

console.log(mod)
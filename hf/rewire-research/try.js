const Module = require('module')

const mod = new Module('./hmm')

console.log(mod)

const hmm = require('./hmm')
console.log(hmm)
// const hmm = rewire('./hmm')

// hmm.__set__("fn_", () => console.log("fn intercepted"))

// hmm.b()

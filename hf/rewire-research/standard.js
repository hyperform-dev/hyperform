const rewire = require('./lib/index')

const hmm = rewire('./hmm')

hmm.__set__('fn_', () => console.log("fn intercepted"))

console.log("========================")
hmm.a()
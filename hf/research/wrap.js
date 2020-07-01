// const hmm = require('./hmm')

// console.log(hmm)

// // scopes are sticky af...

// function a() {
//   console.log('ovberridden a')
// }

// const newhmm = { ...hmm }
// newhmm.a = a 

// console.log(newhmm)

// newhmm.b()

/// ////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////
// module.exports = {
//   a: function () { console.log('a') },
//   ab: function () { this.a(); console.log('b') },
// }

// const env = {
//   // a: function () { console.log('intercepted a ayyy') },
// }

// const boundab = module.exports.ab.bind(env)
// boundab() 

// ALTERALTERALTERALTER (aber halt mit this)

/// ////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////

// function a() {
//   console.log('a')
// }

// function ab() {
//   a() 
//   console.log('b')
// }

// const env = {
//   a: function () { console.log('intercepted a') },
// }

// const boundab = ab.bind(env)
// boundab() 

///////////////////////////////////////////////

//  SCOPE ÄNDERN FUNZT (benutzt eval aber was solls)
// => eval nur files mit mehreren fn_ 


// const rewire = require('rewire')
// const hmmr = rewire('./hmm')

// hmmr.__set__("a", () => console.log("a intercepted"))

// hmmr.b()

///////////////////////////////
///////////////////////////////
///////////////////////////////

// NOV-0 //

// const rewire = require('rewire')

// const hmm = rewire('./hmm')

// hmm.a()

// hmm.__set__('fn_', () => console.log("intercepted fn_ ayy"))
// console.log("===")
// hmm.a()

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////
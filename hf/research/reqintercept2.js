// const stdrequire = require 
// const myrequire = (...args) => {
//   const imp = stdrequire(...args)
//   if(typeof imp === 'object') {
//     const newimp = {...imp}
//     const newimpKeys = Object.keys(newimp)
//     for(let i = 0; i < newimpKeys; i+=1) {
//       const impKey = newimpKeys[i]
//       const impVal = newimp[impKey]
//       console.log(impKey)
//       console.log(impVal)
//     }
//   //  imp.intercepted_by.push('requireintercept 2')
//     imp.fn_ = () => console.log("fn_ intercepted by reqintercept2")
//     // ... possibly inject
//     return imp
//   } else {
//     return imp
//   }
// }
// require = myrequire

// // try provoking stacking require
// const hmm = require('./requireintercept')


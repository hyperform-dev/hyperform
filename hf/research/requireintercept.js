/* eslint-disable */


const stdrequire = require 
const myrequire = (...args) => {
  const imp = stdrequire(...args)
  if(typeof imp === 'object') {
    // ... inject
    return imp
  } else {
    return imp
  }
}
require = myrequire

/////
/////
/////
/////


function ab() {
  const { fn_c } = require('./hmm')
  fn_c()
}

ab()


module.exports = {
  ab
}
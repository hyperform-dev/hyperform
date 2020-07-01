/* eslint-disable */


const stdrequire = require 
//const myrequire = (...args) => { console.log("ayyy myrequire"); return stdrequire(...args);}
const myrequire = () => ({ a: () => console.log("booh") })
require = myrequire

/////
/////
/////
/////


function ab() {
  const { a } = require('./a')
  a()
}

ab()

const stdrequire = require 
const myrequire = (...args) => {
  const imp = stdrequire(...args)
  if(typeof imp === 'object') {
    const fn_keys = Object.keys(imp)
      .filter(key => /^fn_/.test(key) === true)

    for(let i = 0; i < fn_keys.length; i+=1) {
      const key = fn_keys[i]
      imp[key] = (() => console.log(`intercepted ${key}`))
    }

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

/* eslint-disable arrow-body-style */
// HOLY SHIET

// function magic(func) {
//   const str = func.toString();

//   ((print) => {
//     const evald = eval(str)
//     evald() // you gotta use eval so it absorbs scope here
//   })(() => console.log("ayy"))
// }

// magic(() => {
//   const a = 1
//   const b = 2
//   const c = 3
//   print()
// })

// DONT FORGET SEMIS 

///////////////////////////////////////////////////////
// For module appending
//////////////////////////////////////////////////////

function fn_() {
  console.log("fn_1")
}

function a() {
  console.log("a")
  b()
}


function b() {
  console.log("b")
  fn_()
}

module.exports = {
  a,
  b,
  fn_
}



function teach(func, names, vals) {

  // Wrap function in IFFE arrow function (that does nothing)
  // Necessary because eval only works well with arrow functions

  const funcstr = `(() => (${func.toString()})())`; // HAHAHAHA 

  let taughtfuncstr = `
  ((${names.join(', ')}) => {
    const taughtfunc = eval(funcstr);  // you gotta use eval so it absorbs scope here
    return taughtfunc; // NICE
  })(${vals.map(v => `(${v.toString()})`).join(', ')}); // HAHHAHAHAHAH
  `
  const taughtfunc = eval(taughtfuncstr)
  return taughtfunc
}

module.exports = (() => {

  const neww = {...module.exports}
  const aKeys = Object.keys(neww).filter(k => /^fn_/.test(k) === false )
  const fnKeys = Object.keys(neww).filter(k => /^fn_/.test(k) === true )

  // Array of all fn_ being envoys
  // KEEP ORDER VISAVI FNKEYS
  const setFn_s = fnKeys.map(fnKey => ( () => console.log("fn intercepted") ) )


  // Teach each the setFn_s
  let taughtAs = []
  for(let i = 0; i < aKeys.length; i += 1) {
    const aKey = aKeys[i]
    const aVal = neww[aKey]

    // teach aVal all fn_
    const taughtAVal = teach(
      aVal,
      fnKeys,
      setFn_s
    )

   
    taughtAs.push(taughtAVal)
  }

  // set in neww
  // fn_'s
  for(let i = 0; i < fnKeys.length; i++) {
    const fnKey  = fnKeys[i]
    const setFn = setFn_s[i]
    neww[fnKey] = setFn
  }

  // a's
  for(let i = 0; i < aKeys.length; i+=1) {
    const aKey = aKeys[i]
    const taughtA = taughtAs[i]
    neww[aKey] = taughtA
  }

  return neww

})();


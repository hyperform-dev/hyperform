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
  console.log("fn_")
}

function b() {
  // TODO
  fn_()
}

module.exports = {
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


; module.exports = (() => {
  const newexp = { ...module.exports }
  const b = newexp.b
  const bnew = teach(
    b,
    ["dummy", "fn_"],
    [() => { }, () => console.log("fn_ intercepted")]
  )

  return { ...newexp, b: bnew }
})();


module.exports.b()
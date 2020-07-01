/* eslint-disable */

function magic(func) {
  const str = func.toString();

  // HOLY SHIET

  ((print) => {
    const evald = eval(str)
    evald()
  })(() => console.log("ayy"))
}

magic(() => {
  const a = 1
  const b = 2
  const c = 3
  print()
})

//Python has lexical scoping. 
//That means the meaning of an identifier is determined solely based on the scopes that physically surround it when you look at the source code.

// => prepend definitions

// myinc    = lambda input: envoy ... 
// myincinc = lambda input: 

// user code


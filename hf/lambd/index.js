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


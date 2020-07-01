function endpoint_hellotwo(input) {
  console.log("hello")
  console.log("input: ", input)
  return { a: 1 }
}

module.exports = {
  endpoint_hellotwo
}
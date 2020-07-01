function endpoint_hello(input) {
  console.log("hello")
  console.log("input: ", input)
  return { a: 1, intptus: input }
}

module.exports = {
  endpoint_hello
}
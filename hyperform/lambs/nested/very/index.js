function endpoint_hello(input) {
  console.log("hello")
  console.log("iput: ", input)
  return { a: 1}
}

module.exports = {
  endpoint_hello
}



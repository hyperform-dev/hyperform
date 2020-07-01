function endpoint_oho(input) {
  console.log(`userfunc: input was : ${input}`)
  console.log(`userfunc: typeof input was : ${typeof input}`)
  return { b: 2, inputWas: input }
}

function endpoint_somethnew6(input) {
  return { msg: 'ayy' }
}

module.exports = {
  endpoint_oho,
  endpoint_somethnew6,
}

function a() {
  console.log('a')
}

function b() {
  console.log('b')
}

function fn_myinc({ num }) {
  return {
    num: num + 1,
  }
}

module.exports = {
  a,
  b,
  fn_myinc,
}

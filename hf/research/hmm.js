function a() {
  console.log('a')
}

function b() {
  a()
  console.log('b')
}

function fn_c() {
  console.log('fn_c')
}

module.exports = {
  a,
  b,
  fn_c,
}

// webpack includes all in that file.. nice

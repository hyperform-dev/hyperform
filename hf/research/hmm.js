function a() {
  console.log('a')
}

function b() {
  a()
  console.log('b')
}

module.exports = {
  b,
}

// webpack includes all in that file.. nice

/* eslint-disable */
function a() {
  console.log('a')
}

function b() {
  console.log('b')
}

async function fn_myinc({ num }) {
  return {
    num: num + 1,
  }
}

module.exports = require('../template')({
  a,
  b,
  fn_myinc
})

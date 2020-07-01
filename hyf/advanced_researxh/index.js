/* eslint-disable */


async function fn_myinc({ num }) {
  return { num: num + 1 }
}

function a() {
  console.log('a')
  b()
}

function b() {
  console.log('b')
  fn_myinc({ num: 3 })
}

module.exports = {
  a,
  b,
  fn_myinc,
};

module.exports = require('./change')(module.exports)


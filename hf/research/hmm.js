
////////////////////////////////
////////////////////////////////
////////////////////////////////

// // NOV-0

// function fn_() {
//   console.log('fn_')
// }

// function a() {
//   console.log('a')
//   b()
// }

// function b() {
//   console.log('b')
//   fn_()
// }


// module.exports = {
//   a,
//   b,
//   fn_
// }


/////////////////////////////////////////////



function fn_() {
  console.log('fn_')
}

function a() {
  console.log('a')
  b()
}

function b() {
  console.log('b')
  fn_()
}

module.exports = {
  a,
  b,
  fn_,
  intercepted_by: []
}



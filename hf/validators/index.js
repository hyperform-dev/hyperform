const { flattenObject, isFunction } = require('../utils/index')
const { logdev } = require('../utils/index')

function validateInputOne(input) {
  logdev('validating input: ', input)
  if (input == null) {
    throw new Error(`HF input must be object, but is undefined: ${input}`)
  }
  if (typeof input !== 'object') {
    throw new Error(`HF input must be object, but is ${typeof input} : ${input}`)
  }
  if (input.constructor === Array) {
    throw new Error(`HF input must be object, but is Array: ${input}`)
  }
  // checked by !== 'object'
  // if (isFunction(input)) {
  //   throw new Error(`HF input must be object, but is function: ${input}`)
  // }
  // ensure no input field is a function
  // (would  lead to weird behavior because they too will be called )
  const flattened = flattenObject(input)
  const vals = Object.values(flattened)
  vals.forEach((val) => {
    if (isFunction(val) === true) {
      throw new Error(`HF input must not contain any functions (this would lead to weird behavior) but does: ${input}`)
    }
  })
}

function validateInputMany(inputarr) {
  logdev('validating input: ', inputarr)
  if (inputarr == null) {
    throw new Error(`HF input must be object, but is undefined: ${inputarr}`)
  }
  
  inputarr.forEach((input, idx) => {
    try {
      validateInputOne(input)
    } catch (e) {
      throw new Error(`Element ${idx} in input array is invalid: ${e}`)
    }
  })
}

function validateStep(step) {
  if (step == null) {
    throw new Error(`HF step must be object, but is undefined: ${step}`)
  }
  if (typeof step !== 'object') {
    throw new Error(`HF step must be object, but is ${typeof step} : ${step}`)
  }
  if (step.constructor === Array) {
    throw new Error(`HF step must be object, but is Array: ${step}`)
  }
  // checked by !== 'object'
  // if (isFunction(step)) {
  //   throw new Error(`HF step must be object, but is function: ${step}`)
  // }
}

module.exports = {
  validateInputOne,
  validateInputMany,
  validateStep,
}

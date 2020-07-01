require('util').inspect.defaultOptions.depth = null
const { amazonEnvoy: { envoy } } = require('./envoys/amazon/index')
const { validateStep, validateInputOne, validateInputMany } = require('./validators/index')
const { isFunction, isObject } = require('./utils/index')
const { logdev } = require('./utils/index')
// TODO make envoy more powerful
// TODO try out with some things etc

/**
 * 
 * @param {*} prev Tree or subtree thereof
 * @param {*} step Step or substep thereof (analogous to prev). 
 * Can contain functions that resolve to values. 
 * They will be called with all (the entire tree) as first argument
 * @param {*} all The entire tree.
 */
async function evl(prev, step, all) {
  const nnew = { ...prev }
  const stepkeys = Object.keys(step)
  // for each step key (we only care about prevkeys via stepkeys)
  for (let i = 0; i < stepkeys.length; i += 1) {
    const stepkey = stepkeys[i]
    const stepfield = step[stepkey]
    // (1) check if it's a function 
    if (isFunction(stepfield) === true) {
      // we shoud evaluate it; passing it prev as first argument
      logdev('field ', stepkey, ' is a function')
      nnew[stepkey] = await stepfield(all) // pass entire prev state to user function
    }
    // (2) check if it's further nested
    else if (isObject(stepfield) === true) {
      logdev('field ', stepkey, ' is a nested obj')
      // call recursively  on sub
      nnew[stepkey] = await evl(nnew[stepkey], stepfield, all)
    }
    // (3) otherwise, just set directly
    else {
      logdev('field', stepkey, ' is primitive ')
      nnew[stepkey] = stepfield
    }
  }
  return nnew
}

class Hyperform {
  constructor() {
    this.steps = []
    this.stepslocked = false
  }

  /**
   * @param {*} step 
   */
  b(step) {
    if (this.stepslocked === true) {
      throw new Error(`add: you tried to modify your hyperform while/after running it at least once. This is forbidden to not disturb hfs that could be running. Step you tried to add: ${step}`)
    }
    validateStep(step)
    this.steps.push(step)
  }

  /**
   * 
   * @param {*} input 
   */
  async r(input) {
    validateInputOne(input)
    // freeze steps
    this.stepslocked = true
    let curr = input

    for (let i = 0; i < this.steps.length; i += 1) {
      const after = await evl(curr, this.steps[i], curr)
      curr = after
    }

    return curr
  }
}

const createHyperform = (flow) => {
  const hf = new Hyperform()
  flow.forEach((fl) => hf.b(fl))
  return (input) => hf.r(input)
}
module.exports = {
  Hyperform,
  envoy,
  createHyperform,
}

// const c = createHyperform([
//   { 
//     num: (prev) => prev.num + 1,
//   },
//   {
//     a: (prev) => prev.num,
//   },
// ])

// c({ 
//   num: 1,
// })
//   .then(console.log)

// const hf = new Hyperform()

// hf.b({
//   a: {
//     b: {
//       c: 1,
//     },
//   },
// })

// hf.b({
//   a: {
//     b: {
//       c: ({ a: { b: { c } } }) => c + 1,
//     },
//   },
// })

// /// ///////////////////////////
// /// ///////////////////////////

// hf.b({
//   a: {
//     b: {
//       c: ({ c }) => c + 1,
//     },
//   },
// })

require('util').inspect.defaultOptions.depth = null
// const { Namecache } = require('../ck/namecache/index')
const { Stash } = require('../ck/stashes/index')
const { amazonEnvoy: { envoy } } = require('../ck/envoys/amazon/index')

const { validateStep, validateInput } = require('./validators/index')
const { isFunction, isObject, flattenObject } = require('./utils/index')
// TODO pull dependencies in from ck
// TODO make envoy more powerful
// TODO fix b, r and annoying order
// TODO try out with some things etc

/**
 * 
 * @param {*} prev Tree or subtree thereof
 * @param {*} step Step or substep thereof (analogous to prev). 
 * Can contain functions that resolve to values. They will be called with all (the entire tree) as first argument
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
      console.log('field ', stepkey, ' is a function')
      nnew[stepkey] = await stepfield(all) // pass entire prev state to user function
    }
    // (2) check if it's further nested
    else if (isObject(stepfield) === true) {
      console.log('field ', stepkey, ' is a nested obj')
      // call recursively  on sub
      nnew[stepkey] = await evl(nnew[stepkey], stepfield, all)
    }
    // (3) otherwise, just set directly
    else {
      console.log('field', stepkey, ' is primitive ')
      nnew[stepkey] = stepfield
    }
  }
  return nnew
}

class Hyperform {
  constructor() {
    // this.namecache = new Namecache() // TODO put namecache into envoy? 
    // this.stash = new Stash() // TODO there is no stash / run should create private one per run
    this.steps = []
    this.stepslocked = false
  }

  /**
   * 
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
    validateInput(input)
    // freeze steps, don't allow any more modifications from now on after
    this.stepslocked = true

    // this run's eventual output
    let curr = input

    // run steps one after the other
    for (let i = 0; i < this.steps.length; i += 1) {
      const after = await evl(curr, this.steps[i], curr)
      curr = after
    }

    // all steps finished
    return curr
  }
}

module.exports = {
  Hyperform,
}

/* eslint-disable arrow-body-style, no-use-before-define */
const { enrichedschemas } = require('../schemas/enriched/index')
const { envoy } = require('../envoys/index')
const { sharedStash } = require('../stashes')
// This file is about building an internal representation,
// not to be confused with "building & deploying"

// takes an object such as 
// { run: "function1", in: "function0" }
// and creates a asyncronius function that when run, will run that fn in the cloud 
// ... and return its result or a promise thereof. Calls envoy.

// NO TWO canBuild should overlap (be true at the same time). Any of them might be picked
const nodebuilders = {
  // Name of the AFCL construct
  atomic: {
    canBuild: (obj) => {
      const schema = enrichedschemas.flat_atomic
      const { error } = schema.validate(obj)
      return !error
    },
    build: async (obj) => {
      return async function () {
        const inp = sharedStash.get(obj.in)
        const outp = await envoy(obj.run, inp)
        sharedStash.put(obj.run, outp)
      }
    },
  },

  sequence: {
    canBuild: (obj) => {
      const schema = enrichedschemas.flat_sequence
      const { error } = schema.validate(obj)
      return !error
    },
    build: async (obj) => {
      const builtMembers = obj.map((o) => build(o))
      await Promise.all(builtMembers)
      
      return async function () {
        // Build each member fn in the sequence
        // Run one after the other
        // Data transfer is handled automatically over shmem (sharedStash)
        for (let i = 0; i < obj.length; i += 1) {
          await builtMembers[i]()
        }
      }
    },
  },
  // doParallel: async (obj) => {
  //   // build each member in doParallel
  //   const builtMembers = obj.doParallel.map((o) => build(o))
  //   await Promise.all(builtMembers)

  //   // return a function that runs these member functions in parallel, 
  //   // completes when all are done
  //   return async function () {
  //     if (!obj.doParallel.length) {
  //       return undefined
  //     }

  //     const proms = builtMembers.map((fn) => {

  //     })
  //     await Promise.all(
  //       obj.doParallel.map((n) => build(node)),
  //     )
  //   }
  // },
}

function detectnodetype(obj) {
  for (const [nodetype, v] of Object.entries(nodebuilders)) {
    if (v.canBuild(obj) === true) {
      return nodetype
    }
  }
  throw new Error(`No builder claimed responsibility (canBuild) for ${obj}`)
}

/**
 * Takes any type of node, and recursively turns them into invocable functions that return promises.
 * // TODO recursively lol
 * @param {*} obj 
 * @returns {Promise<overalloutval>}
 */
function build(obj) {
  // find out which builder to use
  const nodetype = detectnodetype(obj)
  // build the node function
  return nodebuilders[nodetype].build(obj)
}

// async function main() {
//   sharedStash.put('inn', { num: 1 })
//   const fn = await build({ run: 'arn:aws:lambda:us-east-2:735406098573:function:myinc', in: 'inn' })
//   await fn()
//   console.log(sharedStash.get('arn:aws:lambda:us-east-2:735406098573:function:myinc'))
// }

// main()

module.exports = {
  _onlyfortesting_detectnodetype: detectnodetype,
  build,
}

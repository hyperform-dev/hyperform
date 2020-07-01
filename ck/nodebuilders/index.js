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
    //  console.log('building atomic')
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
    //  console.log('building sequence')
      // Build each member fn in the sequence
      // Note: Seems to runaway if not immediately .all'ed
      const builtMembers = await Promise.all(obj.map((o) => build(o)))
      return async function () {
        // Run one after the other
        // Data transfer is handled automatically over shmem (sharedStash)
        for (let i = 0; i < builtMembers.length; i += 1) {
          await builtMembers[i]()
        }
      }
    },
  },
  doParallel: {
    canBuild: (obj) => {
      const schema = enrichedschemas.flat_doParallel
      const { error } = schema.validate(obj)
      return !error
    },
    build: async (obj) => {
      // Note: Seems to runaway if not immediately .all'ed
      const builtSections = await Promise.all(obj.doParallel.map((sec) => build(sec)))

      return async function () {
        // Run them in parallel, wait for all to complete
        const proms = builtSections.map((fn) => fn())
        await Promise.all(proms)
      }
    },
  },

  // doParallel: {
  //   canBuild: (obj) => {
  //     const schema = enrichedschemas.flat_doParallel 
  //     const { error } = schema.validate(obj)
  //     return !error
  //   },
  //   build: async (obj) => {
  //     // build each section 
  //     const builtSections = obj.doParallel.map((sec) => build(sec))
  //     await Promise.all(builtSections)

  //     return async function () {
  //       // Run them in parallel, wait for all to complete
  //       const proms = builtSections.map((fn) => fn())
  //       await Promise.all(proms)
  //     }
  //   },
  // },
}

function detectnodetype(obj) {
  for (const [nodetype, v] of Object.entries(nodebuilders)) {
    if (v.canBuild(obj) === true) {
      return nodetype
    }
  }
  throw new Error(`No builder claimed responsibility (canBuild) for ${JSON.stringify(obj)}`)
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
  // console.log('BUILDING ', nodetype)
  return nodebuilders[nodetype].build(obj)
}

// async function main() {
//   sharedStash.put('inn', { num: 1 })
//   const fn = await build([
//     {
//       doParallel: [
//         { run: 'arn:aws:lambda:us-east-2:735406098573:function:myinc', in: 'inn' },
//         { run: 'arn:aws:lambda:us-east-2:735406098573:function:myincinc', in: 'inn' },
//       ],
//     },
//   ])
//   console.log('tyoef', typeof fn)
//   await fn()
//   console.log(sharedStash.getall())
//   // await fn()
//   // console.log(sharedStash.getall())
//   // console.log(sharedStash.get('arn:aws:lambda:us-east-2:735406098573:function:myinc'))
// }

// main()

module.exports = {
  _onlyfortesting_detectnodetype: detectnodetype,
  build,
}

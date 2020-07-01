/* eslint-disable arrow-body-style, no-use-before-define */
const joi = require('joi')

const { enrichedschemas } = require('../schemas')
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
      const schema = enrichedschemas.atomic
      const { error } = schema.validate(obj)
      if (error) {
        return false
      } else {
        return true
      }
    },
    build: (obj) => function (input) {
      return envoy(obj.run, input)
    },
  },

  sequence: {
    canBuild: (obj) => {
      const schema = enrichedschemas.sequence
      const { error } = schema.validate(obj)
      if (error) {
        return false
      } else {
        return true
      }
    },
    build: async (obj) => {
      // Build each member in the sequence
      const builtMembers = obj.map((o) => build(o))
      await Promise.all(builtMembers)

      // return a function that runs these member functions one after the other
      return async function () {
        if (!obj.length) {
          return undefined
        }
        // TODO retrieve also first input from stash (?) 
        let inp
        let outp
        for (let i = 0; i < builtMembers.length; i += 1) {
          inp = sharedStash.get(obj[i].in)
          // run fn
          outp = await builtMembers[i](inp)
          // set output for next fn
          sharedStash.put(obj[i].id, outp)
        }
        // does not return anything, use 'in' fields for reference
      }
    },
    
  },
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
  if (!nodebuilders[nodetype]) {
    throw new Error(`Could not build unknown nodetype ${nodetype}`)
  }
  // use that builder from above
  return nodebuilders[nodetype].build(obj)
}

/// /////////////////////////////////////////////////////

// const arr = [
//   {
//     run: 'arn:aws:lambda:us-east-2:735406098573:function:myinc',
//     id: 'arn:aws:lambda:us-east-2:735406098573:function:myinc',
//     in: 'innn',
//   },
//   {
//     run: 'arn:aws:lambda:us-east-2:735406098573:function:myincinc',
//     id: 'arn:aws:lambda:us-east-2:735406098573:function:myincinc',
//     in: 'arn:aws:lambda:us-east-2:735406098573:function:myinc',
//   },
// ]

// async function main() {
//   sharedStash.put('innn', { num: 1 })

//   const fn = await build(arr)
//   const res = await fn()
//   // console.log(sharedStash.get('arn:aws:lambda:us-east-2:735406098573:function:myincinc'))
// }

// main()

module.exports = {
  detectnodetype,
  build,
}

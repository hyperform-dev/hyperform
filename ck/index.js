const { validate } = require('./parsers/index')
const { enrich } = require('./enrichers/index')
const { build } = require('./nodebuilders/index')
const { getAllFunctionNames } = require('./utils/index')
const { resolveName } = require('./resolvers/index')
const { Namecache } = require('./namecache/index')
const { Stash } = require('./stashes/index')
const { spinnies } = require('./printers/index')
const { validateOutput } = require('./utils/index')
// TODO enforce ck is run in project root
// TODO (prob already done, since it checks for flow)

const LANG = 'js'

class Cloudkernel {
  constructor(flow) {
    if (!flow) {
      throw new Error('Cloudkernel constructor wasnt passed a flow')
    }
    // validate according to flow.json preset
    console.time('validate')
    validate(flow, 'flow.json') // TODO don't allow empty flows
    console.timeEnd('validate')

    this.flow = flow 
    this.namecache = new Namecache() 
    this.stash = new Stash()

    const allFunctionNames = getAllFunctionNames(flow)
    
    // "heat up" namecache
    // in the background, resolve ambiguous function names to exact URI's (arns...)
    // writes to the namecache
    allFunctionNames
      .forEach((fname) => {
        // don't await, we don't care about the result
        // just kick it off and let it run in the background
        console.time(`resolve ${fname}`)
        resolveName(fname, this.namecache)
        console.timeEnd(`resolve ${fname}`)
      })

    // deploy/update functions that are found in (1) flow.json and (2) in the current directory
    // TODO do somewhere else
    // const localfnpath = path.join(root, '..', 'recruiter', 'tm')
    // await recruiter(localfnpath, LANG, allFunctionNames)

    // infer data flow from control flow
    // add some fields for internal representation
    const [enrichedFlow, outputKey] = enrich(
      flow,
      { in: '__workflow_in' },
    )

    this.enrichedFlow = enrichedFlow 
    this.outputKey = outputKey
  }

  async run(input) {
    // validate input 
    console.time('validate input')
    validateOutput(input, 'input')
    console.timeEnd('validate input')

    // put WF input on stash
    this.stash.put('__workflow_in', input)

    console.time('wf')
    // build top-level function
    console.time('build-wf')
    const wf = await build(this.enrichedFlow, this.stash, this.namecache)
    console.timeEnd('build-wf')

    // run WF
    console.time('run-wf')
    await wf()
    console.timeEnd('run-wf')

    console.timeEnd('wf')

    // get WF output from shash
    const result = this.stash.get(this.outputKey)
    spinnies.stopAll()
    // log(result)
    return result
  }
}

module.exports = {
  Cloudkernel,
}

// /**
//  * Exposed API
//  * @param {*} flow 
//  * @param {*} input 
//  * @param {{ recruit?: string }} options `recruit` optional path to where functions lie. Those matching names with flow will be deployed / uploaded before workflow begins
//  */
// async function main(flow, input, options) {
//   // TODO check how this does with multiple invok etc

// TODO only expose cloudkernel here, do everything else in CLI, in server (recruit, ...)
//   const myclk = new Cloudkernel(flow)
  
//   if (options && options.recruit) {
//     const whitelist = getAllFunctionNames(flow)
//     const root = options.recruit
//     await recruiter(root, LANG, whitelist)
//   }
//   const res = await myclk.run(input)
//   return res
// }

// module.exports = {
//   main,
// }

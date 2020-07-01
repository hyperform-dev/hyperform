#!/usr/bin/env node

const arg = require('arg')
const path = require('path')
const { readparsevalidate } = require('./parsers/index')
const { enrich } = require('./enrichers/index')
const { sharedStash } = require('./stashes')
const { build } = require('./nodebuilders/index')
const { initProject } = require('./initer/index')
const { getAllFunctionNames } = require('./utils/index')
const { resolveName } = require('./resolvers/index')
const { log } = require('./utils/index')
const { recruiter } = require('../recruiter/index')
const { spinnies } = require('./printers/index')
// TODO enforce ck is run in project root
// TODO (prob already done, since it checks for flow)

const LANG = 'js'

async function main() {
  // Top level error boundary of ck
  console.time('all')
  try {
    // force user to invoke clk in directory with flow.json (akin to pip, npm)
    const root = process.cwd()
    
    // parse cli args
    const args = arg({
      '--in': String,
      '--verbose': Boolean,
      '-v': '--verbose',
    })

    // he just wants to init
    if (args._ && args._.includes('init')) {
      initProject(root)
      process.exit(0)
    }

    // he wants to run the workflow

    if (args['--in'] == null) {
      throw new Error('Please specify input with --in "{ ... } / [ ... ]" ')
    }

    // try to parse CLI input as json
    let parsedInput
    try {
      parsedInput = JSON.parse(args['--in'])
    } catch (e) {
      log('--in "...JSON..." is invalid JSON')
      throw e
    }

    // parse flow.json in current directory
    const parsedFlowJson = await readparsevalidate({
      presetName: 'flow.json',
      path: path.join(root, 'flow.json'),
    })

    const allFunctionNames = getAllFunctionNames(parsedFlowJson)
    // "heat up" namecache
    // in the background, resolve ambiguous function names to exact URI's (arns...)
    // writes to the namecache
    allFunctionNames
      .forEach((fname) => {
        // don't await, we don't care about the result
        // just kick it off and let it run in the background
        resolveName(fname)
      })

    // deploy/update functions that are found in (1) flow.json and (2) in the current directory
    const localfnpath = path.join(root, '..', 'recruiter', 'tm')
    await recruiter(localfnpath, LANG, allFunctionNames)

    // add some fields for internal representation
    const [enrichedFlowJson, outputkey] = await enrich(
      parsedFlowJson,
      { in: '__workflow_in' },
    )

    // put WF input on stash
    sharedStash.put('__workflow_in', parsedInput)

    const lastKey = outputkey
    // build top-level function
    const wf = await build(enrichedFlowJson)
    // run WF
    await wf()

    console.timeEnd('all')

    // get WF output from shash
    const result = sharedStash.get(lastKey)
    spinnies.stopAll()
    log(result)
    //
  } catch (e) {
    log(e)
    process.exit(1)
  }
}

main()

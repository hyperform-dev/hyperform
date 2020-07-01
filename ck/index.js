#!/usr/bin/env node

const arg = require('arg')
const path = require('path')
const { readparsevalidate } = require('./parsers/index')
const { enrich } = require('./enrichers/index')
const { sharedStash } = require('./stashes')
const { build } = require('./nodebuilders/index')
const { initProject } = require('./initer/index')
const { getAllFunctionNames } = require('./utils/index')
const { resolve } = require('./resolvers/index')

// TODO enforce ck is run in project root
// TODO (prob already done, since it checks for flow)

/**
 * 
 * @returns { mode: 'init'|'deploy', root: String}
 */
function parseCliArgs() {
  const args = arg({
    '--in': String,
  })

  // Defaults
  let mode = 'run'
  if (args._ && args._.includes('init')) mode = 'init'
  // if (args._ && args._.includes('deploy')) mode = 'deploy'
 
  // ~~ Force user to invoke dd in his project folder (akin to pip, npm)
  const root = process.cwd()

  // Just init and close
  if (mode === 'init') {
    initProject(root)
    process.exit(0)
  }

  // User wants to run the workflow
  if (args['--in'] == null) {
    throw new Error('Please specify input with --in "...JSON...". ')
  }

  // Try to parse CLI input as JSON
  let parsedInput // TODO what's void? Null? Empty object: we don't care, stash does not care either
  try {
    parsedInput = JSON.parse(args['--in'])
  } catch (e) {
    console.log('--in "...JSON..." is invalid JSON')
    throw e
  }

  return {
    ...args,
    mode: mode,
    root: root,
    parsedInput: parsedInput,
  }
}

async function main() {
  // Top level error boundary of ck
  console.time('all')
  try {
    const args = parseCliArgs()
    const parsedFlowJson = await readparsevalidate({
      presetName: 'flow.json',
      path: path.join(args.root, 'flow.json'),
    })

    // "heat up" namecache
    // in the background, resolve ambiguous function names to exact URI's (arns...)
    // writes to the namecache
    getAllFunctionNames(parsedFlowJson)
      .forEach((fname) => {
        // don't await, we don't care about the result
        // just kick it off and let it run in the background
        resolve(fname)
      })

    const [enrichedFlowJson, outputkey] = await enrich(
      parsedFlowJson, 
      { in: '__workflow_in' },
    )
    
    // put WF input on shash
    sharedStash.put('__workflow_in', args.parsedInput)
    
    const lastKey = outputkey
    // build top-level function
    const wf = await build(enrichedFlowJson)
    // run WF
    await wf()
    
    console.timeEnd('all')
    
    // get WF output from shash
    console.log(sharedStash.get(lastKey))
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}

main()

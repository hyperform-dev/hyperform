const arg = require('arg')
const path = require('path')
const { readparsevalidate } = require('./parsers/index')
const { enrich } = require('./enrichers/index')
const { sharedStash } = require('./stashes')
const { build } = require('./nodebuilders/index')
const { initProject } = require('./initer/index')

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

    const [enrichedFlowJson, outputkey] = await enrich(
      parsedFlowJson, 
      { in: '__workflow_in' },
    )
    
    //   console.log(JSON.stringify(enrichedFlowJson, null, 2))
    // Put --input (the workflow input) onto stash
    sharedStash.put('__workflow_in', args.parsedInput)
    
    const lastKey = outputkey
    // build top-level function
    const wf = await build(enrichedFlowJson)
    //  console.log(JSON.stringify(wf))
    // run top-level function
 
    await wf()
    
    console.timeEnd('all')
    
    // print output
    console.log(sharedStash.get(lastKey))
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}

main()

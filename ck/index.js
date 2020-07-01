const arg = require('arg')
const path = require('path')
const { readparsevalidate } = require('./parsers/index')
const { enrich } = require('./enrichers/index')
const { sharedStash } = require('./stashes')
const { build } = require('./nodebuilders/index')
/**
 * 
 * @returns { mode: 'init'|'deploy', root: String}
 */
function parseCliArgs() {
  const args = arg({
  })

  // Defaults
  let mode = 'run'
  if (args._ && args._.includes('init')) mode = 'init'
  // if (args._ && args._.includes('deploy')) mode = 'deploy'
 
  // ~~ Force user to invoke dd in his project folder (akin to pip, npm)
  const root = process.cwd()

  return {
    mode: mode,
    root: root,
  }
}

async function main() {
  // Top level error boundary of ck
  try {
    const args = parseCliArgs()
    const parsedFlowJson = await readparsevalidate({
      presetName: 'flow.json',
      path: path.join(args.root, 'flow.json'),
    })

    console.log(parsedFlowJson)
    process.exit()
    
    const enrichedFlowJson = await enrich(parsedFlowJson)

    sharedStash.put('__workflow_in', { num: 1 })

    // TODO overhaul lol
    
    // build top-level function
    const lastid = parsedFlowJson.slice(-1)[0].id
    const wf = await build(parsedFlowJson)
    await wf()

    console.log(sharedStash.get(lastid))
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}

main()

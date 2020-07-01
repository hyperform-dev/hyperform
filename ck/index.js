const arg = require('arg')
const path = require('path')
const { readparsevalidate } = require('./parsers/index')
const { envoy } = require('./envoys/index')
const { sharedStash } = require('./stashes')
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

    sharedStash.put('__workflow_in', { num: 1 })

    const sequence = parsedFlowJson

    // EE LOOP
    // Currently only supports sequence of "run"-s
    for (let i = 0; i < parsedFlowJson.length; i += 1) {
      const fnDetails = sequence[i]
      const input = sharedStash.get(fnDetails.in)

      console.log(input)
      const output = await envoy(fnDetails.run, input)

      console.log(output)

      // function output is next function's input (use fn name ('run' field) as identifier)
      sharedStash.put(fnDetails.id, output)
    }

    console.log(`FINISHED; result: ${JSON.stringify(sharedStash.getall())}`)
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}

main()

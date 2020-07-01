const arg = require('arg')
const path = require('path')
const { readparsevalidate } = require('./parsers/index')
const { envoy } = require('./envoys/index')
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

    // "stack"
    let inp = { num: 1 }

    const sequence = parsedFlowJson

    // Currently only supports sequence of "run"-s
    for (let i = 0; i < parsedFlowJson.length; i += 1) {
      const atomicfn = sequence[i]
      console.log(inp)
      const res = await envoy(atomicfn.run, inp)
      console.log(res)
      // function output is next function's input
      inp = res
    }

    console.log(`FINISHED; result: ${JSON.stringify(inp)}`)
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}

main()

#!/usr/bin/env node
const arg = require('arg')
const path = require('path')
const { log } = require('./utils/index')
const { Cloudkernel } = require('./index')
const { readparse } = require('./parsers/index')
const { initProject } = require('./initer/index')

async function cli() {
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
  
  // try to read and parse flow.json 
  // does not validate it, that's done later
  const parsedFlowJson = await readparse(
    path.join(root, 'flow.json'), 
    'flow.json',
  )
  /// ///////////////////////////////////////////////////////////////////////
  /// ///////////////////////////////////////////////////////////////////////
  /// ///////////////////////////////////////////////////////////////////////
  // run main
  const clk = new Cloudkernel(parsedFlowJson)
  const res = await clk.run(parsedInput)
  log(res) // log result terminal
  /// ///////////////////////////////////////////////////////////////////////
  /// ///////////////////////////////////////////////////////////////////////
  /// ///////////////////////////////////////////////////////////////////////
}

cli()

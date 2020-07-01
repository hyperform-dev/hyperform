#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const { main } = require('./index')
const { init } = require('./initer/index')
const { getParsedHyperformJson } = require('./parser/index')
// Ingest CLI arguments
// DEV NOTE: Keep it brief and synchronious

let mode 

if (process.argv.length !== 3 || /init|deploy/.test(process.argv[2]) === false) {
  console.log(`Usage: 
 $ hyperform init|deploy`)
  process.exit(1)
}

mode = process.argv[2]
// $ hyperform should always be invoked in the desired directory
const absdir = process.cwd()

// Mode is init
if (mode === 'init') {
  init(absdir)
  process.exit()
}

// Mode is deploy

// hide timing info
console.time = () => { }
console.timeEnd = () => { }

// try to parse hyperform.json
const hyperformJsonExists = fs.existsSync(path.join(absdir, 'hyperform.json'))
if (hyperformJsonExists === false) {
  console.log(`No hyperform.json found. You can create one with:
 $ hyperform init`)
  process.exit(1)
}
const parsedHyperformJson = getParsedHyperformJson(absdir)

// be overgenerous in detecting endpoints
// in worst case we add a nothing-doing module appendix code
const fnregex = /endpoint_/

// Top-level error boundary
try {
  // Main
  main(absdir, fnregex, parsedHyperformJson)
} catch (e) {
  console.log(e)
  process.exit(1)
}

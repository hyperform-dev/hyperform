#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const { main } = require('./index')
const { init } = require('./initer/index')
const { getParsedHyperformJson } = require('./parser/index')
// Ingest CLI arguments
// DEV NOTE: Keep it brief and synchronious

const args = process.argv.slice(2)

if ((/init|deploy/.test(args[0]) === false) || (args.length > 1 && /--allow-unauthenticated/.test(args[1]) === false)) {
  console.log(`Usage: 
 $ hyperform init
 $ hyperform deploy [--allow-unauthenticated]
`)
  process.exit(1)
}

const mode = args[0]
const allowUnauthenticated = (/--allow-unauthenticated/.test(args[1]) === true)

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
  main(absdir, fnregex, parsedHyperformJson, allowUnauthenticated)
} catch (e) {
  console.log(e)
  process.exit(1)
}

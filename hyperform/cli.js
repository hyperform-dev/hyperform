#!/usr/bin/env node
const path = require('path')
const { main } = require('./index')

if (process.argv.length !== 3) {
  console.log(`Usage: 
 $ hyperform path/to/dir`)
  process.exit(1)
}

// hide timing info
console.time = () => { }
console.timeEnd = () => { }

const dir = process.argv[2]
const absdir = path.resolve(
  process.cwd(),
  dir,
)

// be overgenerous, in worst case we add a nothing-doing module appendix code
const fnregex = /endpoint_/

// Top-level error boundary
try {
  // Main
  main(absdir, fnregex)
} catch (e) {
  console.log(e)
  process.exit(1)
}

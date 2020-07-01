#!/usr/bin/env node
const { main } = require('./index')
const path = require('path')

if (process.argv.length !== 3) {
  console.log(`Usage: 
 $ hyperform path/to/dir`)
  process.exit(1)
}


const dir = process.argv[2]
const absdir = path.resolve(
  process.cwd(),
  dir
)
const fnregex = /^endpoint_/

main(absdir, fnregex)
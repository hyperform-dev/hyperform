#!/usr/bin/env node

const { parseCliArgs } = require('./utils/index')
const { initProject } = require('./initer/index')
const { main } = require('./index')

const { mode, root } = parseCliArgs()
if (mode === 'init') {
  initProject(root)
  process.exit(0)
} else {
  main({ mode, root })
}

#!/usr/bin/env node

const { recruiter } = require('./index')

const root = process.cwd()
const lang = 'js'
recruiter(root, lang)

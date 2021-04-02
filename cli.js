#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const semver = require('semver')
const { init } = require('./initer/index')
const { getParsedHyperformJson } = require('./parser/index')
const { log } = require('./printers/index')
const { maybeShowSurvey, answerSurvey } = require('./surveyor/index')
const packagejson = require('./package.json')

// Ingest CLI arguments
// DEV NOTE: Keep it brief and synchronious

const args = process.argv.slice(2)

// Check node version
const version = packagejson.engines.node 
if (semver.satisfies(process.version, version) !== true) {
  console.log(`Hyperform needs node ${version} or newer, but version is ${process.version}.`);
  process.exit(1);
}

if (
  (/init|deploy/.test(args[0]) === false) 
 || ((args.length === 1) && args[0] !== 'init') 
|| (args.length === 3 && args[2] !== '--url') 
|| args.length >= 4) {
  log(`Usage: 
 $ hf init                          # Creates config in current directory
 $ hf deploy some/file.js [--url]   # Deploys exports of a Javascript file
`)
  process.exit(1)
}

// $ hf MODE FPATH [--url]
const mode = args[0]
const fpath = args[1]
const isPublic = (args[2] === '--url')

const currdir = process.cwd() 

// Mode is init
if (mode === 'init') {
  init(currdir)
  process.exit()
}

// Mode is answer survey
if (mode === 'answer') {
  const answer = args.slice(1) // words after $ hf answer
  // Send anonymous answer (words and date recorded)
  answerSurvey(answer)
    .then(process.exit())
}

// Mode is deploy

// try to read hyperform.json
const hyperformJsonExists = fs.existsSync(path.join(currdir, 'hyperform.json'))
if (hyperformJsonExists === false) {
  log(`No hyperform.json found. You can create one with:
 $ hf init`)
  process.exit(1)
}
// parse and validate hyperform.json
const parsedHyperformJson = getParsedHyperformJson(currdir)

// Dev Note: Do this as early as possible

// Load AWS Credentials from hyperform.json into process.env
// These are identical with variables that Amazon CLI uses, so they may be set
// However, that is fine, hyperform.json should still take precedence
if (parsedHyperformJson.amazon != null) {
  process.env.AWS_ACCESS_KEY_ID = parsedHyperformJson.amazon.aws_access_key_id,
  process.env.AWS_SECRET_ACCESS_KEY = parsedHyperformJson.amazon.aws_secret_access_key,
  process.env.AWS_REGION = parsedHyperformJson.amazon.aws_default_region
  // may, may not be defined.
  process.env.AWS_SESSION_TOKEN = parsedHyperformJson.amazon.aws_session_token
}

// Load GC Credentials from hyperform.json into process.env
// These are different from what Google usually occupies (GCLOUD_...)
if (parsedHyperformJson.google != null) {
  process.env.GC_CLIENT_EMAIL = parsedHyperformJson.google.gc_client_email,
  process.env.GC_PRIVATE_KEY = parsedHyperformJson.google.gc_private_key,
  process.env.GC_PROJECT = parsedHyperformJson.google.gc_project
}

// Top-level error boundary
try {
  // Main
  // Do not import earlier, it needs to absorb process.env set above
  // TODO: make less sloppy
  const { main } = require('./index')
  main(currdir, fpath, parsedHyperformJson, isPublic)
    // show anonymous survey question with 1/30 probability
    .then(() => maybeShowSurvey())
} catch (e) {
  log(e)
  process.exit(1)
}

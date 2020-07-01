#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const { init } = require('./initer/index')
const { getParsedHyperformJson } = require('./parser/index')
const { log } = require('./printers/index')
const { maybeShowSurvey, answerSurvey } = require('./surveyor/index')
// Ingest CLI arguments
// DEV NOTE: Keep it brief and synchronious

const args = process.argv.slice(2)

if ((/init|deploy/.test(args[0]) === false) || (args.length > 1 && /--allow-unauthenticated/.test(args[1]) === false)) {
  log(`Usage: 
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

// Mode is answer survey
if (mode === 'answer') {
  const answer = args.slice(1) // words after $ hyperform answer
  // Send anonymous answer (words and date recorded)
  answerSurvey(answer)
    .then(process.exit())
}

// Mode is deploy

// try to read hyperform.json
const hyperformJsonExists = fs.existsSync(path.join(absdir, 'hyperform.json'))
if (hyperformJsonExists === false) {
  log(`No hyperform.json found. You can create one with:
 $ hyperform init`)
  process.exit(1)
}
// parse and validate hyperform.json
const parsedHyperformJson = getParsedHyperformJson(absdir)

// Dev Note: Do this as early as possible

// Load AWS Credentials from hyperform.json into process.env
// These are identical with variables that Amazon CLI uses, so they may be set
// However, that is fine, hyperform.json should still take precedence
process.env.AWS_ACCESS_KEY_ID = parsedHyperformJson.amazon.aws_access_key_id,
process.env.AWS_SECRET_ACCESS_KEY = parsedHyperformJson.amazon.aws_secret_access_key,
process.env.AWS_REGION = parsedHyperformJson.amazon.aws_default_region

// Load GC Credentials from hyperform.json into process.env
// These are different from what Google usually occupies (GCLOUD_...)
process.env.GC_CLIENT_EMAIL = parsedHyperformJson.google.gc_client_email,
process.env.GC_PRIVATE_KEY = parsedHyperformJson.google.gc_private_key,
process.env.GC_PROJECT = parsedHyperformJson.google.gc_project

// The regex that determines whether a function will be uploaded as serverless function
const fnregex = /endpoint/

// Top-level error boundary
try {
  // Main
  // Do not import earlier, it needs to absorb process.env set above
  // TODO: make less sloppy
  const { main } = require('./index')
  main(absdir, fnregex, parsedHyperformJson, allowUnauthenticated)
    // show anonymous survey question with 1/30 percent probability
    .then(() => maybeShowSurvey())
} catch (e) {
  log(e)
  process.exit(1)
}

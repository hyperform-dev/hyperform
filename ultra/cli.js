#!/usr/bin/env node

const readline = require('readline');
const arg = require('arg')
const { keepSync } = require('./index')

async function main() {
  const args = arg({
    '--bucket': String,
  })

  if (!args['--bucket']) {
    throw new Error('Specify --bucket BUCKETNAMEORARN')
  }

  const p = process.cwd()
  const bucket = args['--bucket']

  // Ask user if he wants to proceed
  console.log(`Sync ${p} to S3?`)
  console.log('Press ENTER to continue, any other key to cancel')

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);

  // Listen for ENTER key
  const shouldContinue = await new Promise((resolve, reject) => {
    process.stdin.on('keypress', (letter, key) => {
      // only continue if it was enter
      if (key && /return|enter/.test(key.name) === true) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  })

  // Re-enable standard events (CTRL-C exits script and so on) again
  process.stdin.setRawMode(false);

  // Proceed
  if (shouldContinue === true) {
    keepSync(p, bucket)
    // Cancel
  } else {
    console.log('Canceled')
    process.exit(0)
  }
}

main()

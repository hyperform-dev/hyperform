const chalk = require('chalk')

/**
 * Logs a Lambda's stdout in the local terminal, after it has completed
 * @param {*} envoyRes What comes back from the lambda, parsed
 */

function extractStdout(logline) {
  if (!logline || !logline.trim()) {
    return ''
  }
  if (
    /^START /.test(logline) === true
    || /^END /.test(logline) === true 
    || /^REPORT /.test(logline) === true
  ) {
    return ''
  }

  const l = logline.split('INFO') 
  if (l) {
    return l[1] // stdout appears after 'INFO'
  }
  // fallback: just print whole line (rather print too much that to little)
  return l
}

function amazonLog(envoyRes) {
  if (envoyRes && envoyRes.LogResult) {
    // base-64 decode it
    let logstr = envoyRes.LogResult
    logstr = Buffer.from(logstr, 'base64').toString('ascii')
    // Split, trim lines, extract real stdout, trim again
    const loglines = logstr
      .split('\n')
      .map((l) => l && l.trim()) // trim lines
      .map((l) => extractStdout(l)) // get real stdout
      .filter((l) => l.length)
      .map((l) => l.replace(/^\t/, '')) // trim leading tab (aws style) user had it

    // print it ( TODO lol )
    const styleIt = (l) => `${chalk.rgb(20, 20, 20).bgHex('#52d89a')('Amazon')} ${l}`
    loglines
      .map((l) => styleIt(l))
      .map((l) => console.log(l))
  }
}

module.exports = {
  amazonLog,
}

const chalk = require('chalk')
const { log } = require('../../utils/index')
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
  if (l.length === 2) {
    return l[1] // stdout appears after 'INFO'
  } 
  // fallback: just print whole line (rather print too much that to little)
  return logline
}

/**
 * 
 * @param {*} envoyRes 
 * @param {*} name 
 */
function amazonLog(envoyRes, name) {
  if (envoyRes && envoyRes.LogResult) {
    // base-64 decode it
    let logstr = envoyRes.LogResult
    logstr = Buffer.from(logstr, 'base64').toString('ascii')
    // Split, trim lines, extract real stdout, trim again
    const loglines = logstr
      .split('\n')
      .map((l) => l && l.trim()) // trim lines
      .map((l) => extractStdout(l)) // get real stdout
      .filter((l) => l && l.length)
      .map((l) => l.replace(/^\t/, '')) // trim leading tab (aws style) user had it

    // print it ( TODO lol )
    const styleIt = (l) => `${chalk.rgb(20, 20, 20).bgWhite(` ${name} `)} ${l}`
    loglines
      .map((l) => styleIt(l))
      .map((l) => log(l))
  }
}

module.exports = {
  amazonLog,
}

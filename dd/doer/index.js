const util = require('util');
const exec = util.promisify(require('child_process').exec);
const lstat = util.promisify(require('fs').lstat);
const { EOL } = require('os')
const { spinnies } = require('../printer/index')
/**
 * @param {{path: string, command: string, hint: string}} options 
 * @returns {Promise<void>}
 */
async function runDo(options) {
  // Show progress spinner 
  spinnies.add(options.path, { text: `Building ${options.hint}` })
  // ensure path is a directory
  const lstatRes = await lstat(options.path)
  if (lstatRes.isDirectory() === false) {
    spinnies.fail(options.path, { text: `Building Error: Path must be directory, but is ${options.path}` })
    throw new Error(`do: path must be directory, but is ${options.path}`)
  }

  try {
    const { stdout } = await exec(options.command, { cwd: options.path })
  // We don't need to notify about building success since we deploy right after
  } catch (e) {
    // TODO somehow get stdout up until the error & print it
    spinnies.fail(options.path, { text: `Building Error: "do" script run in '${options.path}' returned a non-zero exit code: ${EOL} ${e}` })
    throw e
  }
}

module.exports = { runDo }

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const lstat = util.promisify(require('fs').lstat);
const { EOL } = require('os')
const { spinnies } = require('../printer')
/**
 * 
 * @param {string} path The path of the lambda folder
 */
async function runDo(path, command, hint) {
  // Show progress spinner 
  spinnies.add(path, { text: `Building ${hint}` })
  // ensure path is a directory
  const lstatRes = await lstat(path)
  if (lstatRes.isDirectory() === false) {
    spinnies.fail(path, { text: `Building Error: Path must be directory, but is ${path}` })
    throw new Error(`do: path must be directory, but is ${path}`)
  }

  try {
    const { stdout } = await exec(command, { cwd: path })
  // We don't need to notify about building success since we deploy right after
  //  spinnies.succeed(path, { text: `Built ${hint}` })
  } catch (e) {
    // TODO somehow get stdout up until the error & print it
    spinnies.fail(path, { text: `Building Error: "do" script run in '${path}' returned a non-zero exit code: ${EOL} ${e}` })
    throw e
  }
}

module.exports = { runDo }

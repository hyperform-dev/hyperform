const util = require('util');
const exec = util.promisify(require('child_process').exec);
const lstat = util.promisify(require('fs').lstat);
const { spinnies } = require('../printer')

/**
 * 
 * @param {string} path The path of the lambda folder
 */
async function runDo(path, command, hint) {
  // Show progress spinner 
  spinnies.add(path, { text: `Building ${hint}` })
  // TODO DO somewhere else along with semantic validation
  // ensure path is a directory
  const lstatRes = await lstat(path)
  if (lstatRes.isDirectory() === false) {
    spinnies.fail(path, { text: `Building Error: Path must be directory, but is ${path}` })
    throw new Error(`do: path must be directory, but is ${path}`)
  }

  try {
    const { stdout } = await exec(command, { cwd: path })
    //  console.log(stdout)
    spinnies.succeed(path, { text: `Built ${hint}` })
  } catch (e) {
    spinnies.fail(path, { text: `Building Error: "do" script returned a non-zero exit code: ${e}` })
    throw e
  }
}

module.exports = { runDo }

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const lstat = util.promisify(require('fs').lstat);

const fs = require('fs')
/**
 * 
 * @param {string} path The path of the lambda folder
 */
async function runDo(path, command) {
  // TODO DO somewhere else along with semantic validation
  // ensure path is a directory
  console.log(`RUNDO, ${path} , ${command}`)
  const lstatRes = await lstat(path)
  if (lstatRes.isDirectory() === false) {
    throw new Error(`do: path must be directory, but is ${path}`)
  }

  try {
    const { stdout } = await exec(command, { cwd: path })
    console.log(stdout)
  } catch (e) {
    throw e
  }
}

module.exports = { runDo }

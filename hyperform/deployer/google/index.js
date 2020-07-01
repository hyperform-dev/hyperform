const util = require('util');
const exec = util.promisify(require('child_process').exec);

/**
 * @description Returns shell command that newly deploys or updates "options.name" GCF 
 * // TODO does Google consider changed options on subsequent deploys, or ignore them?
 * @param {string} pathToCode 
 * @param {{
 * name: string,
 * region: string,
 * runtime: string,
 * entrypoint: string,
 * stagebucket: string,
 * timeout?: Number
 * }} options 
 * @returns {string} 
 */
function createDeployCommand(pathToCode, options) {
  let cmd = `gcloud functions deploy ${options.name} --region ${options.region} --trigger-http --runtime ${options.runtime} --entry-point ${options.entrypoint} --source ${pathToCode} --stage-bucket ${options.stagebucket} --allow-unauthenticated`

  if (options.timeout) cmd += ` --timeout ${options.timeout}`
  return cmd
}

/**
 * @description Extracts the endpoint URL from the STDOUT of "gcloud deploy"
 * @param {string} stdout 
 * @returns {string} The endpoint URL
 */
function extractUrl(stdout) {
  let line = stdout.split('\n')
    .filter((l) => l && l.length > 0)
    .filter((l) => /url: /.test(l) === true)[0]

  line = line
    .replace('url:', '')
    .trim()
  return line
}

/**
 * @description Creates or updates "options.name" GCF with given code
 * // TODO does Google consider changed options on subsequent deploys, or ignore them?
 * @param {string} pathToCode 
 * @param {{
 * name: string,
 * entrypoint: string,
 * stagebucket: string,
 * region?: string,
 * runtime?: string,
 * }} options 
 * @returns {Promise<string>} The endpoint URL
 */
async function deployGoogle(pathToCode, options) {
  // TODO make more things required lol
  if (!options.name) {
    throw new Error(`name must be specified but is ${options.name}`)
  }

  const fulloptions = {
    name: options.name,
    region: options.region || 'us-central1',
    runtime: options.runtime || 'nodejs12',
    entrypoint: options.entrypoint, // currently identical to name 
    stagebucket: options.stagebucket,
  }

  const uploadCmd = createDeployCommand(pathToCode, fulloptions)

  try {
    console.time(`Google-deploy-${fulloptions.name}`)
    const { stdout } = await exec(uploadCmd, { encoding: 'utf-8' })
    const url = extractUrl(stdout)
    console.timeEnd(`Google-deploy-${fulloptions.name}`)
    return url
  } catch (e) {
    console.log(`Errored google deploy: ${e}`)
    throw e
  }
}

module.exports = {
  deployGoogle,
}

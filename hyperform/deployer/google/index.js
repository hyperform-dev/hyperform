const util = require('util');
const exec = util.promisify(require('child_process').exec);

// TODO create zip for amazon, create just dir with file for google
/**
 * 
 * @param {string} pathToCode 
 * @param {{
 * name: string,
 * region: string,
 * runtime: string,
 * entrypoint: string,
 * stagebucket: string
 * 
 * }} options 
 */

function createDeployCommand(pathToCode, options) {


  let cmd  = `gcloud functions deploy ${options.name} --region ${options.region} --trigger-http --runtime ${options.runtime} --entry-point ${options.entrypoint} --source ${pathToCode} --stage-bucket ${options.stagebucket} --allow-unauthenticated`
  
  if(options.timeout) cmd += ` --timeout ${options.timeout}`
  return cmd

}

/**
 * 
 * @param {string} pathToCode 
 * @param {{
 * name: string,
 * region?: string,
 * runtime?: string,
 * 
 * }} options 
 */
async function deployGoogle(pathToCode, options) {
  // TODO make more things required lol
  if(!options.name ) {
    throw new Error(`name must be specified but is ${options.name}`)
  }

  const fulloptions = {
    name: options.name,
    region: options.region || 'us-central1',
    runtime: options.runtime || 'nodejs12',
    entrypoint: options.entrypoint, // same as name 
    stagebucket: 'jak-functions-stage-bucket'
  }

  const uploadCmd = createDeployCommand(pathToCode, fulloptions)

  try {
    console.time(`Google-deploy-${fulloptions.name}`)  
    await exec(uploadCmd)
  
  } catch(e) {
    console.log(`Errored google deploy: ${e}`)
    throw e
  }
  console.timeEnd(`Google-deploy-${fulloptions.name}`)
}

module.exports = {
  deployGoogle
}


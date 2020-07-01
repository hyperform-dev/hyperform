const {
  createLambda,
  deleteLambda,
  updateLambdaCode,
  createLambdaRole,
  isExistsAmazon, 
} = require('./utils')
const { logdev } = require('../../printers/index')

/**
 * @description If Lambda "options.name" does not exist yet in "options.region", 
 * it deploys a new Lambda with given code ("pathToZip") and "options". 
 * If Lambda exists, it just updates its code with "pathToZip", and ignores "options"
 * @param {*} pathToZip Path to the zipped Lambda code
 * @param {{
 * name: string, 
 * region: string,
 * ram?: number,
 * timeout?: number,
 * handler?: string
 * }} options 
 * @returns {Promise<string>} The Lambda ARN
 */
async function deployAmazon(pathToZip, options) {
  if (!options.name || !options.region) {
    throw new Error(`name and region must be specified, but are ${options.name}, ${options.region}`) // HF programmer mistake
  }

  const existsOptions = {
    name: options.name,
    region: options.region,
  }
  // check if lambda exists 
  const exists = await isExistsAmazon(existsOptions)

  logdev(`isexists ${options.name} : ${exists}`)
  // if not, create new role 
  const roleName = `hf-${options.name}`
  const roleArn = await createLambdaRole(roleName)

  /* eslint-disable key-spacing */
  const fulloptions = {
    name:           options.name,
    region:         options.region,
    role:           roleArn,
    runtime:        'nodejs12.x',
    timeout:        options.timeout || 60, // also prevents 0
    ram:            options.ram || 128,
    handler:        options.handler || `index.${options.name}`,
  }
  /* eslint-enable key-spacing */
  
  // anonymous function that when run, creates or updates Lambda
  let upload
  if (exists === true) {
    upload = async () => updateLambdaCode(pathToZip, fulloptions)
  } else {
    upload = async () => createLambda(pathToZip, fulloptions)
  }

  // Helper
  const sleep = async (millis) => new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, millis);
  })

  // Retry loop (4 times). Usually it fails once or twice 
  // if role is newly created because it's too fresh
  // See: https://stackoverflow.com/a/37503076

  let arn 

  for (let i = 0; i < 4; i += 1) {
    try {
      logdev('trying to upload to amazon')
      arn = await upload()
      logdev('success uploading to amazon')
      break // we're done
    } catch (e) {
      // TODO write test that enters here, reliably
      if (e.code === 'InvalidParameterValueException') {
        logdev('amazon deploy threw InvalidParameterValueException (role not ready yet). Retrying in 3 seconds...')
        await sleep(3000) // wait 3 seconds
        continue
      } else {
        logdev(`Amazon upload errorred: ${e}`)
        logdev(JSON.stringify(e, null, 2))
        throw e;
      }
    }
  }

  console.timeEnd(`Amazon-deploy-${options.name}`)

  return arn
}

/**
 * @description Deletes a Lambda function in a given region.
 * @param {string} name Name, ARN or partial ARN of the function
 * @param {string} region Region of the function
 * @throws ResourceNotFoundException, among others
 */
async function deleteAmazon(name, region) { 
  await deleteLambda(name, region)
}

module.exports = {
  deployAmazon,
  deleteAmazon,
}

const fsp = require('fs').promises
const { CloudFunctionsServiceClient } = require('@google-cloud/functions');
const fetch = require('node-fetch')
const { logdev } = require('../../printers/index')

let gcOptions
if (process.env.GC_PROJECT) {
  gcOptions = {
    projectId: process.env.GC_PROJECT,
  }
}
// Don't consult hyperform.json yet for Google credentials

// if (process.env.GC_CLIENT_EMAIL && process.env.GC_PRIVATE_KEY && process.env.GC_PROJECT) {
//   gcOptions = {
//     credentials: {
//       client_email: process.env.GC_CLIENT_EMAIL,
//       private_key: process.env.GC_PRIVATE_KEY,
//     },
//     projectId: process.env.GC_PROJECT,
//   }
// }

const client = new CloudFunctionsServiceClient(gcOptions)

/**
 * @description Checks whether a GCF 
 * exists in a given project & region
 * @param {{
 * name: string,
 * project:string
 * region: string,
 * }} options 
 * @returns {Promise<boolean>}
 */
async function isExistsGoogle(options) {
  const getParams = {
    name: `projects/${options.project}/locations/${options.region}/functions/${options.name}`,
  }

  try {
    const res = await client.getFunction(getParams)
    if (res.length > 0 && res.filter((el) => el).length > 0) {
      return true 
    } else {
      return false
    }
  } catch (e) {
    return false 
  }
}

/**
 * @description Uploads a given file (usually code .zips) to a temporary 
 * Google storage and returns 
 * its so-called signed URL.
 * This URL can then be used, for example 
 * as sourceUploadUrl for creating and updating Cloud Functions. 
 * @param {string} pathToFile 
 * @param {{
 *  project: string,
 *  region: string
 * }} options 
 * @returns {Promise<string>} The signed upload URL
 * @see https://cloud.google.com/storage/docs/access-control/signed-urls Google Documentation
 */
async function uploadGoogle(pathToFile, options) {
  const generateUploadUrlOptions = {
    parent: `projects/${options.project}/locations/${options.region}`,
  }

  const signedUploadUrl = (await client.generateUploadUrl(generateUploadUrlOptions))[0].uploadUrl

  // Upload zip
  // TODO use createReadStream instead
  const zipBuf = await fsp.readFile(pathToFile)
  await fetch(signedUploadUrl, {
    method: 'PUT',
    headers: {
      'content-type': 'application/zip',
      'x-goog-content-length-range': '0,104857600',
    },
    body: zipBuf,
  })
  logdev('uploaded zip to google signed url')

  return signedUploadUrl
}

/**
 * @description Updates an existing GCF "options.name" in "options.project", "options.region" 
 * with given uploaded code .zip. 
 * And, in theory, arbitrary options too (timeout, availableMemoryMb), 
 * but currently not needed but could easily be added.
 * Returns immediately, but Google updates for 1-2 minutes more
* @param {string} signedUploadUrl Signed upload URL where .zip has been uploaded to already.
*  Output of "uploadGoogle".
* @param {{
* name: string,
* project: string,
* region: string,
* runtime: string
* }} options
*/
async function _updateGoogle(signedUploadUrl, options) {
  const updateOptions = {
    function: {
      name: `projects/${options.project}/locations/${options.region}/functions/${options.name}`,
      httpsTrigger: {
        url: `https://${options.region}-${options.project}.cloudfunctions.net/${options.name}`,
      },
      runtime: options.runtime,
      // timeout: {
      //   seconds: 120,
      // },
      sourceUploadUrl: signedUploadUrl,
    },
    // TODO use this (POSITIVE SPECIFY, ie specify all fields that shall be updated)
    // TODOif it's null, it resets all other fields :/
    updateMask: null,
  }
  const res = await client.updateFunction(updateOptions)
  logdev(`google: updated function ${options.name}`)
}

/**
 * @description Creates a new GCF "options.name" in "options.project", "options.region" 
 * with given uploaded code .zip and options. 
 * Returns immediately, but Google creates for 1-2 minutes more
 * @param {string} signedUploadUrl 
 * @param {{
 *  name: string,
 * project: string,
 * region: string,
 * runtime: string,
 * entrypoint?: string,
 * }} options 
 */
async function _createGoogle(signedUploadUrl, options) {
  const createOptions = {
    location: `projects/${options.project}/locations/${options.region}`,
    function: {
      name: `projects/${options.project}/locations/${options.region}/functions/${options.name}`,
      httpsTrigger: {
        url: `https://${options.region}-${options.project}.cloudfunctions.net/${options.name}`,
      },
      entryPoint: options.entrypoint || options.name, 
      runtime: options.runtime,
      sourceUploadUrl: signedUploadUrl,
      timeout: {
        seconds: 60, //
      }, // those are the defaults anyway
      availableMemoryMb: 256,
    },
  }
  const res = await client.createFunction(createOptions)
  // TODO wait for operaton to complete (ie setInterval done && !error, promise resolve then)
  // TODO in _updateGoogle too
  logdev(`google: created function ${options.name}`)
}

/**
 * 
 * @param {{
 * name: string,
 * project: string,
 * region: string
 * }} options 
 */
async function _allowPublicInvokeGoogle(options) {
  // TODO GetIam and get etag of current role first 
  // And then specify that in setIam, to avoid race conditions
  // @see "etag" on https://cloud.google.com/functions/docs/reference/rest/v1/Policy

  const setIamPolicyOptions = {
    resource: `projects/${options.project}/locations/${options.region}/functions/${options.name}`,
    policy: {
      // @see https://cloud.google.com/functions/docs/reference/rest/v1/Policy#Binding
      bindings: [
        {
          role: 'roles/cloudfunctions.invoker',
          members: ['allUsers'],
          version: 3,
        },
      ],
    },
  }

  logdev('setting IAM policy')
  const res = await client.setIamPolicy(setIamPolicyOptions)
}

/**
 * @description If Google Cloud Function "options.name" 
 * does not exist yet in "options.project", "options.region", 
 * it creates a new GCF with given code ("pathToZip") and "options". 
 * If GCF exists already, it updates its code with "pathToZip". 
 * If other options are specified, it can update those too (currently only "runtime"). 
 * Returns IAM-protected URL immediately, but Cloud Function takes another 1-2 minutes to be invokable.
 * @param {string} pathToZip 
 * @param {{
 * name: string,
 * project: string,
 * region: string,
 * runtime: string,
 * entrypoint?: string
 * }} options 
 * @returns {Promise<string>} The endpoint URL
 * @see https://cloud.google.com/functions/docs/reference/rest/v1/projects.locations.functions#CloudFunction For the underlying Google SDK documentation
 */
async function deployGoogle(pathToZip, options) {
  if (!options.name || !options.project || !options.region || !options.runtime) {
    throw new Error(`name, project and region and runtime must be defined but are ${options.name}, ${options.project}, ${options.region}, ${options.runtime}`) // HF programmer mistake
  }

  const existsOptions = {
    name: options.name,
    project: options.project,
    region: options.region, 
  }
  // Check if GCF exists
  const exists = await isExistsGoogle(existsOptions)

  logdev(`google isexists ${options.name}: ${exists}`)

  // Either way, upload the .zip
  // @see https://cloud.google.com/storage/docs/access-control/signed-urls
  const signedUploadUrl = await uploadGoogle(pathToZip, {
    project: options.project,
    region: options.region, 
  })

  // if GCF does not exist yet, create it
  if (exists !== true) {
    const createParams = {
      ...options,
    }
    await _createGoogle(signedUploadUrl, createParams)
  } else {
    // GCF exists, update code and options (currently none)
    const updateParams = {
      name: options.name,
      project: options.project,
      region: options.region, 
      runtime: options.runtime, 
    }
    await _updateGoogle(signedUploadUrl, updateParams)
  }
   
  // Construct endpoint URL (it's deterministic)
  const endpointUrl = `https://${options.region}-${options.project}.cloudfunctions.net/${options.name}`

  // Note: GCF likely not ready by the time we return its URL here
  return endpointUrl 
}

/**
 * @description Allows anyone to call function via its HTTP endpoint. 
 * Does so by turning IAM checking of Google off. 
 * Unlike publishAmazon, publishgoogle it does not return an URL, deployGoogle does that already.
 *  @param {*} name 
  * @param {*} project 
  * @param {*} region 
 */
async function publishGoogle(name, project, region) {
  const allowPublicInvokeOptions = {
    name: name,
    project: project, 
    region: region, 
  }
  await _allowPublicInvokeGoogle(allowPublicInvokeOptions)
}

module.exports = {
  deployGoogle,
  publishGoogle,
  _only_for_testing_isExistsGoogle: isExistsGoogle,
}

const aws = require('aws-sdk')
const fsp = require('fs').promises
const { spinnies } = require('../../printer/index')

const s3 = new aws.S3();

/**
 * 
 * @param {{filepath: string, key: string, bucket: string}} options 
 */
async function uploadFileS3(options) {
  const filecontents = await fsp.readFile(options.filepath, { encoding: 'utf8' })
  const params = {
    Bucket: options.bucket,
    Key: options.key,
    Body: filecontents,
  }

  return s3.upload(params).promise()
}

// async function downloadFileS3(key) {
//   const params = {
//     Bucket: 'jak-bridge-typical',
//     Key: key,
//   }
//   return s3.getObject(params).promise()
// }

/**
 * Uploads (mirrors) file on s3, with same path etc
 * @param {} filepath Eg '/home/qng/lambdas/index.js'
 */
async function syncAmazon(filepath, bucket) {
  spinnies.add(filepath, { text: `Uploading ${filepath}` })
  // Exactly mirror file on S3, with same path as on local OS
  return (
    uploadFileS3({
      filepath: filepath,
      key: filepath,
      bucket: bucket,
    })
      .then(() => spinnies.succeed(filepath, { text: `Uploaded ${filepath}` }))
      .catch((e) => spinnies.fail(filepath, { text: `Failed to upload ${filepath}. ${e}` }))
  )
}

module.exports = {
  syncAmazon,
}

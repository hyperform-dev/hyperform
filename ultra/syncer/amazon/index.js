const aws = require('aws-sdk')
const fsp = require('fs').promises

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

  return s3.upload(params).promise().then(() => console.log(`Uploaded ${options.filepath}`))
}

// async function downloadFileS3(key) {
//   const params = {
//     Bucket: 'jak-bridge-typical',
//     Key: key,
//   }
//   return s3.getObject(params).promise()
// }

module.exports = {
  uploadFileS3,
  // downloadFileS3,
}

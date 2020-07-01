const aws = require('aws-sdk')
const fsp = require('fs').promises

const s3 = new aws.S3();

async function uploadFileS3(filepath, key) {
  const filecontents = await fsp.readFile(filepath, { encoding: 'utf8' })
  const params = {
    Bucket: 'jak-bridge-typical',
    Key: key,
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

module.exports = {
  uploadFileS3,
  // downloadFileS3,
}

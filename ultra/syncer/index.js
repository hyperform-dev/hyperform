const { uploadFileS3 } = require('./amazon/index')
// const { downloadFileS3 } = require('./amazon/index')
// On File change, syncs file to S3 folder 

// TODO make platform agnostic

// const amazonSync = {
//   canSync: function (objstorageroot) {
//     return /^arn:(aws|aws-cn|aws-us-gov):s3:/.test(objstorageroot) === true
//   },
//   sync: async function (abspath, relpath, objstorageroot) {
//     /// relative path acts as key 
//     //= > mirrors directory structure on s3
//     //         objstorageroot is a folder, so it should have a trailing / already
//     return uploadFileS3(abspath, `${objstorageroot}${relpath}`)
//   },
// }

// const syncers = [
//   amazonSync,
// ]

/**
 * Uploads (mirrors) file on s3, with same path etc
 * @param {} filepath Eg '/home/qng/lambdas/index.js'
 */
async function syncAmazon(filepath, bucket) {
  // Exactly mirror file on S3, with same path as on local OS
  return uploadFileS3({
    filepath: filepath,
    key: filepath,
    bucket: bucket,
  })
}

module.exports = {
  syncAmazon,
}

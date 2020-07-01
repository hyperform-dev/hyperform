// const AWS = require('aws-sdk')

// /**
//  * 
//  * @param {*} localpath 
//  * @param {*} bucket 
//  * @param {*} key 
//  */
// async function uploadAmazon(localpath, bucket, key) {
//   const s3 = new AWS.S3()
//   const fsp = require('fs').promises 

//   const contents = await fsp.readFile(localpath)
//   const uploadParams = {
//     Bucket: bucket,
//     Key: key,
//     Body: contents,
//   }
//   await s3.upload(uploadParams).promise() 

//   const s3path = `s3://${bucket}/${key}`
//   return s3path 
// }

// module.exports = {
//   uploadAmazon,
// }

// uploadAmazon('/tmp/zipped-t69Psg/deploypackage.zip', 'jak-bridge-typical', 'deploypppppp.zip')
//   .then(console.log)

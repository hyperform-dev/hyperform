/* eslint-disable import/no-extraneous-dependencies */
const aws = require('aws-sdk')

const s3 = new aws.S3()

exports.handler = async (event, context) => {
  const bucket = 'jak-bridge-typical'
  const key = '/home/qng/tm/file.txt'
  
  const params = {
    Bucket: bucket,
    Key: key,
  }
  console.time(`pulling ${key} from s3`)

  await s3.getObject(params).promise()

  console.timeEnd(`pulling ${key} from s3`)

  context.succeed()
}

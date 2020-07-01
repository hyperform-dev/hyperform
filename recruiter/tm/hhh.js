function myconsolelog(event) {
  console.log(JSON.stringify(event))
}

const aws = require('aws-sdk')

const s3 = new aws.S3()

// WORKS EVEN WITH OUTSIDE DEFINITIONS POG 
function reqawssdk(event) {
  const a = aws
  console.log(aws)
  console.log(a)
}

function myreturnrand() {
  return {
    num: Math.ceil(Math.random() * 100),
  }
}

async function mypulls3(event) {
  const bucket = 'jak-bridge-typical'
  const key = '/home/qng/tm/file.txt'

  const params = {
    Bucket: bucket,
    Key: key,
  }
  console.time(`pulling ${key} from s3`)

  await s3.getObject(params).promise()

  console.timeEnd(`pulling ${key} from s3`)
}

module.exports = {
  myconsolelog,
  reqawssdk,
  mypulls3,
  myreturnrand,
}

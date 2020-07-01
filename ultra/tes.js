// Upload file.txt
const aws = require('aws-sdk')
const { syncAmazon } = require('./syncer/index')

const lambda = new aws.Lambda({ region: 'us-east-2' })

async function main() {
  console.time('sync')
  await syncAmazon('/home/qng/tm/file.txt')
  console.timeEnd('sync')
  console.time('invoke')

  await lambda.invoke({
    FunctionName: 'mypulls3',
    Payload: JSON.stringify({ }),
  }).promise()
  console.timeEnd('invoke')

  console.time('sync')
  await syncAmazon('/home/qng/tm/file.txt')
  console.timeEnd('sync')
}

main()

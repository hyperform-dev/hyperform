console.time('require aws')
const aws = require('aws-sdk')

console.timeEnd('require aws')

console.time('new lambda obj')
const lambda = new aws.Lambda({ region: 'us-east-2' })
console.timeEnd('new lambda obj')

async function invo(uid) {
  const jsonInput = JSON.stringify({ num: 1 })
  // console.time(`invo-${uid}`)
  // console.log(`kicked off ${uid}`)
  return (
    lambda.invoke({
      FunctionName: 'myreturnnum1',
      Payload: jsonInput,
      LogType: 'Tail',
    })
      .promise()
      .then((p) => {
        //     console.timeEnd(`invo-${uid}`)
        if (p && p.FunctionError) {
          throw new Error(`Function myinc failed: ${p.Payload}`)
        }
        return p
      })
  )
}

const ns = 100

console.log(`n: ${ns}`)

const is = [...Array(ns).keys()]

async function main() {
  console.time('kick-off all')
  const prom = Promise.all(is.map((i) => invo(i)))
  console.timeEnd('kick-off all')
  console.time('compl all')
  await prom
  console.timeEnd('compl all')
}

main()

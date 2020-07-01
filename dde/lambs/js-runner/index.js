/* eslint-disable import/no-extraneous-dependencies */
const path = require('path')
const os = require('os')
const fsp = require('fs').promises

const S3 = require('aws-sdk/clients/s3')

const s3 = new S3()

async function getObj(bucket, key) {
  return (
    s3.getObject({
      Bucket: bucket,
      Key: key,
    }).promise()
  )
}

async function pullToTmp(bucket, dirkey) {
  // get list of all files in s3 """"'dir'""""
  const listparams = {
    Bucket: bucket,
    Prefix: dirkey,
  }
  console.time('list objs')
  const list = await s3.listObjectsV2(listparams).promise()
  const fkeys = list.Contents.map((c) => c.Key)
  console.timeEnd('list objs')
  // to replicate s3 folder structure in tmp, derive local path
  // Also makes them relative
  // -> [ '', 'home', 'qng', 'folder' ]
  console.time('dir creation')
  const localpaths = fkeys
    .map((k) => k.split(path.sep))
    .map((k) => k.filter((pathpart) => pathpart)) // in each path, filter out /, empty, null dirs
    .map((k) => k.join(path.sep))

  console.log(localpaths)
  // get all the folders we'll have to create
  // my/path/to/index.js => my/path/to
  const dirpaths = localpaths
    .map((p) => path.dirname(p))

  const tmpeddirpaths = dirpaths
    .map((p) => path.join(os.tmpdir(), p))

  // create all the folders  in TMP
  await Promise.all(
    tmpeddirpaths
      // remove duplicates
      .filter((v, i, a) => a.indexOf(v) === i)
      // create dir
      .map((p) => fsp.mkdir(p, { recursive: true })),
  )
  console.timeEnd('dir creation')
  // pull the files

  console.time('get objs')
  await Promise.all(
    fkeys.map((fkey, idx) => getObj(bucket, fkey)
      .then((res) => res.Body)
      .then((res) => fsp.writeFile(
        path.join(tmpeddirpaths[idx], path.basename(fkey)),
        res,
      ))),
  )
  console.timeEnd('get objs')

  let pr = await fsp.readdir('/tmp/home/qng/tm')
  console.log(pr)
  console.log('=====')
  pr = await fsp.readdir('/tmp/home/qng/tm/your-video-bucket')
  console.log(pr)
  // each file key, download it to tmp
  // fkeys.map((k) => {
  //   const getparams = {
  //     Bucket: bucket,
  //     Key: k,
  //   } 

  //   return (
  //     s3.getObject(getparams).promise()
  //       .then()
  //   )
  // })
}

exports.handler = async (event, context) => {
  if (!event.bucket) {
    throw new Error('Specify eevent.bucket')
  }

  if (!event.key) {
    throw new Error('Specify eevent.key')
  }

  await pullToTmp(event.bucket, event.key)

  // pull code from s3
}

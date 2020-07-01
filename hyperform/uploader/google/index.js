const { Storage } = require('@google-cloud/storage')

const gcloudstorage = new Storage() 

async function uploadGoogle(localpath, bucket, key) {
  const res = await gcloudstorage.bucket(bucket).upload(localpath, { 
    gzip: true,
    destination: key,
    metadata: {
      // Docs: (If the contents will change, use cacheControl: 'no-cache')
      // @see https://github.com/googleapis/nodejs-storage/blob/master/samples/uploadFile.js
      cacheControl: 'no-cache',
    },
  })

  const gsPath = `gs://${bucket}/${key}`
  return gsPath
}

module.exports = {
  uploadGoogle,
}

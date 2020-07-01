/* eslint-disable global-require */

const S3BUCKET = 'jak-bridge-typical'

describe('uploader', () => {
  describe('amazon', () => {
    describe('uploadAmazon', () => {
      test('uploads simple text file, subsequent get returns that file', async () => {
      //   const AWS = require('aws-sdk')
      //   const s3 = new AWS.S3()
      //   const uuidv4 = require('uuid').v4
       
        //   const { uploadAmazon } = require('./index')
        //   const key = `${uuidv4()}`
        //   const filecontents = key
        //   const filecontentsbuffer = Buffer.from(key)

        //   let res 
        //   let err 
        //   try {
        //     res = await uploadAmazon(filecontentsbuffer, S3BUCKET, key)
        //   } catch (e) {
        //     console.log(e)
        //     err = e
        //   }

        //   // it didn't throw
        //   expect(err).not.toBeDefined()
        //   // it returned s3:// ...
        //   expect(typeof res).toBe('string')
        //   expect(res).toBe(`s3://${S3BUCKET}/${key}`)

        //   // getting file immediately after must have same contents
        //   const getParams = {
        //     Bucket: S3BUCKET,
        //     Key: key,
        //   }
        //   const getRes = await s3.getObject(getParams).promise()
        //   const gottenFilecontents = getRes.Body.toString('utf-8')

      //   expect(gottenFilecontents).toBe(filecontents)
      })
    })
  })
})

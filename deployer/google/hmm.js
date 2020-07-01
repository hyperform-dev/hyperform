const { CloudFunctionsServiceClient } = require('@google-cloud/functions');


const client = new CloudFunctionsServiceClient();
const fetch = require('node-fetch')
const fs = require('fs')
// client.createFunction({
//   location: 'projects/firstnodefunc/locations/us-central1', // https://cloud.google.com/functions/docs/reference/rest/v1/projects.locations
//   function: {
//     name: "projects/firstnodefunc/locations/us-central1/functions/endpoint_sdkgeneratedfunc7",
//     // description: "aeiubgewg",
//     // eventTrigger: {
//     //   eventType: "providers/cloud.pubsub/eventTypes/topic.publish",
//     //   resource: 'projects/firstnodefunc/buckets/jak-some-bucket'
//     // },
//     httpsTrigger: {
//       url: 'https://us-central1-firstnodefunc.cloudfunctions.net/endpoint_sdkgeneratedfunc7'
//     },
//     // timeout: {
//     //   seconds: 30
//     // },
//     // availableMemoryMb: 128,
//     entryPoint: "endpoint_sdkcreatedfunc1",
//     runtime: "nodejs12",
//     sourceArchiveUrl: 'gs://jak-some-bucket/deploypackage.zip',
//   }
// })

// client.updateFunction({
//   //   location: 'projects/firstnodefunc/locations/us-central1', // https://cloud.google.com/functions/docs/reference/rest/v1/projects.locations
//      function: {
//        name: "projects/firstnodefunc/locations/us-central1/functions/endpoint_sdkgeneratedfunc7",
//        // // description: "aeiubgewg",
//        // // eventTrigger: {
//        // //   eventType: "providers/cloud.pubsub/eventTypes/topic.publish",
//        // //   resource: 'projects/firstnodefunc/buckets/jak-some-bucket'
//        // // },
//        // httpsTrigger: {
//        //   url: 'https://us-central1-firstnodefunc.cloudfunctions.net/endpoint_sdkgeneratedfunc7'
//        // },
//        timeout: {
//          seconds: 30
//        },
//        // // availableMemoryMb: 128,
//        // entryPoint: "endpoint_sdkcreatedfunc1",
//       // runtime: "nodejs12",
//      //  sourceArchiveUrl: 'gs://jak-some-bucket/deploypackage.zip',
//      },
//      updateMask: {
//        paths: ['timeout.seconds']
//      }
//    })

async function main() {
  const res = await client.generateUploadUrl({
    parent: 'projects/firstnodefunc/locations/us-central1'
  })

  const deployPackageBuffer = fs.readFileSync('/home/qng/deploypackage.zip')

  const uploadUrl = res[0].uploadUrl
  const fetchres = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'content-type': 'application/zip',
      'x-goog-content-length-range': '0,104857600'
    },
    body: deployPackageBuffer
  })
    .then(res => res.text())
    .then(console.log)
  console.log(fetchres)

  console.log("uploaded deploypackage. creating func with signed url...")


  const createres = await client.createFunction({
    location: 'projects/firstnodefunc/locations/us-central1', // https://cloud.google.com/functions/docs/reference/rest/v1/projects.locations
    function: {
      name: "projects/firstnodefunc/locations/us-central1/functions/endpoint_sdkgeneratedfunc8",
      // description: "aeiubgewg",
      // eventTrigger: {
      //   eventType: "providers/cloud.pubsub/eventTypes/topic.publish",
      //   resource: 'projects/firstnodefunc/buckets/jak-some-bucket'
      // },
      httpsTrigger: {
        url: 'https://us-central1-firstnodefunc.cloudfunctions.net/endpoint_sdkgeneratedfunc8'
      },
      // timeout: {
      //   seconds: 30
      // },
      // availableMemoryMb: 128,
      entryPoint: "endpoint_sdkcreatedfunc1",
      runtime: "nodejs12",
      sourceUploadUrl: uploadUrl//'gs://jak-some-bucket/deploypackage.zip',
    }
  })

  console.log(createres)
  console.log("successfully created ")
}
main()
// async function listFunctions() {
//   const [functions] = await client.listFunctions({
//     parent:  'projects/firstnodefunc/locations/-'
//   });
//   console.info(functions);
// }
// listFunctions();
const {CloudFunctionsServiceClient} = require('@google-cloud/functions');


const client = new CloudFunctionsServiceClient();


client.createFunction({
  location: 'projects/firstnodefunc/locations/us-central1', // https://cloud.google.com/functions/docs/reference/rest/v1/projects.locations
  function: {
    name: "projects/firstnodefunc/locations/us-central1/functions/endpoint_sdkgeneratedfunc7",
    // description: "aeiubgewg",
    // eventTrigger: {
    //   eventType: "providers/cloud.pubsub/eventTypes/topic.publish",
    //   resource: 'projects/firstnodefunc/buckets/jak-some-bucket'
    // },
    httpsTrigger: {
      url: 'https://us-central1-firstnodefunc.cloudfunctions.net/endpoint_sdkgeneratedfunc7'
    },
    // timeout: {
    //   seconds: 30
    // },
    // availableMemoryMb: 128,
    entryPoint: "endpoint_sdkcreatedfunc1",
    runtime: "nodejs12",
    sourceArchiveUrl: 'gs://jak-some-bucket/deploypackage.zip',
  }
})

// async function listFunctions() {
//   const [functions] = await client.listFunctions({
//     parent:  'projects/firstnodefunc/locations/-'
//   });
//   console.info(functions);
// }
// listFunctions();
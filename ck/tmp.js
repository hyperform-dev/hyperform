const aws = require('aws-sdk')

const cloudwatchlogs = new aws.CloudWatchLogs({
  region: 'us-east-2',
})

// TODO from .invoke, return logstreamname (we have loggroupname)
// DONE print console.log after completion
// TODO print add beautiful pill label which function, provider
// TODO process log stream

const params = {
  logGroupName: '/aws/lambda/myconsolelog',
  logStreamName: '2020/11/02/[$LATEST]64d3fc53259849e386e5bda34a75cb87', 
  // endTime: 'NUMBER_VALUE',
  // limit: 'NUMBER_VALUE',
  // nextToken: 'STRING_VALUE',
  // startFromHead: true || false,
  // startTime: 'NUMBER_VALUE'
};

cloudwatchlogs.getLogEvents(params, (err, data) => {
  if (err) {
    console.log(err, err.stack);
    return
  }
  data.events.map((e) => console.log(e.message.trim()))
});

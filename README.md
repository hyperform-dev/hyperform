![Hyperform Banner](https://github.com/qngapparat/hyperform/blob/master/hyperform-banner.png)

## Install

```sh
$ npm install -g hyperform-cli
```

## A simple serverless App

```js
// index.js
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const bucket = 'my-todo-s3-bucket'

/**
 * Export each desired endpoint using 'exports' or 'module.exports' (CommonJS)
 * It should have 'endpoint' in its name.
 * 
 * Quick Start:
 * 
 * A) You can import dependencies and code from anywhere. Hyperform uses Webpack internally.
 * B) You can define your endpoints in multiple files, not just index.js
 * C) 'aws-sdk' and '@google/' are included per default
 * D) Your endpoints will receive one argument: the parsed POST JSON body, or the GET query string
*/

exports.endpoint_addTodo = async ({ id, text }) => {
  const todo = {
    id: id,
    text: text,
    completed: false,
  }

  await s3.putObject({
    Bucket: bucket,
    Key: id,
    Body: JSON.stringify(todo),
  }).promise()
}

exports.endpoint_toggleTodo = async ({ id }) => {
  const todo = await s3.getObject({
    Bucket: bucket,
    Key: id,
  })
    .promise()
    .then((res) => JSON.parse(Buffer.from(res.Body).toString())) // TODO

  todo.completed = !todo.completed

  await s3.putObject({
    Bucket: bucket,
    Key: id,
    Body: JSON.stringify(todo),
  }).promise()
}

exports.endpoint_deleteTodo = async ({ id }) => {
  await s3.deleteObject({
    Bucket: bucket,
    Key: id,
  }).promise()
}

```

#### Infer your cloud credentials
```
$ hyperform init
✓ Inferred cloud credentials
✓ Created hyperform.json
```

#### Deploy

```sh 
$ hyperform deploy --allow-unauthenticated
✓  Amazon  endpointGreet https://gmlpjhayh9.execute-api.us-east-2.amazonaws.com
✓  Google  endpointGreet https://us-central1-firstnodefunc.cloudfunctions.net/endpointGreet
```



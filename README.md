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
 * Endpoints should be exported using 'exports' or 'module.exports' (CommonJS)
 * Add 'endpoint' into their name.
 * 
 * Quick Start:
 * 
 * A) Import anything. Hyperform will bundle using Webpack.
 * B) Export anywhere. Your endpoints can be spread over multiple files.
 * C) Included per default: 'aws-sdk' and '@google/'.
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

exports.endpoint_getTodo = async ({ id }) => {
  const todo = await s3.getObject({
    Bucket: bucket,
    Key: id,
  })
    .promise()
    .then((res) => JSON.parse(Buffer.from(res.Body).toString())) // TODO

  return todo
}

exports.endpoint_deleteTodo = async ({ id }) => {
  await s3.deleteObject({
    Bucket: bucket,
    Key: id,
  }).promise()
}

```

That's it!

#### Infer your cloud credentials
```
$ hyperform init
✓ Inferred cloud credentials
✓ Created hyperform.json
```

#### Deploy TODO

should be more, and adapt names

```sh 
$ hyperform deploy --allow-unauthenticated
✓  Amazon  endpointGreet https://gmlpjhayh9.execute-api.us-east-2.amazonaws.com
✓  Google  endpointGreet https://us-central1-firstnodefunc.cloudfunctions.net/endpointGreet
```

#### Invoke TODO

You can `GET` or `POST` to your functions. 
Functions are secured per default. Unless you specified `--allow-unauthenticated`, `$ hyperform deploy` will generate a Bearer token for you. Include it as `Authorization: Bearer {token}` in your requests.

```sh
# Amazon
$ curl https://a82n8xkixj.execute-api.us-east-2.amazonaws.com?id=1&text=Pick%20up%tomatoes # addTodo
> null
$ curl https://gmlpjhieh9.execute-api.us-east-2.amazonaws.com?id=1 # getTodo
> {"id":1,"text":"Pick up tomatoes","completed":false}

# Google
$ curl https://us-central1-firstnodefunc.cloudfunctions.net/endpoint_addTodo?id=1&text=Pick%20up%tomatoes
> null
$ curl https://us-central1-firstnodefunc.cloudfunctions.net/endpoint_getTodo?id=1
> {"id":1,"text":"Pick up tomatoes","completed":false}
```

![Hyperform Banner](https://github.com/qngapparat/hyperform/blob/master/hyperform-banner.png)

## Install

```sh
$ npm install -g hyperform-cli
```

## A simple serverless App

```js
/**
 * 'aws-sdk' and '@google/*' are included per default.
 * 
**/
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const bucket = "my-todo-s3-bucket"

/**
 * Export each desired endpoint using 'exports' or 'module.exports'
 * It should have 'endpoint' in its name
**/

/**
 * 
 * @param {{id: number, text: string}} 
 */
exports.endpoint_addTodo = ({ id, text }) => {
  const todo = {
    id: id,
    text: text,
    completed: false,
  }

  const params = {
    Bucket: bucket,
    Key: `todos/${id}`,
    Body: JSON.stringify(todo),
  }
  await s3.putObject(params).promise()
}

/**
 * 
 * @param {{id: number}} 
 */
exports.endpoint_toggleTodo = ({ id }) => {
  const getParams = {
    Bucket: bucket,
    Key: `todos/${id}`,
  }

  const todo = await s3.getObject(getParams).promise()
    .then((res) => JSON.parse(Buffer.from(res.Body).toString())) // TODO

  todo.completed = !todo.completed

  const putParams = {
    Bucket: bucket,
    Key: `todos/${id}`,
    Body: JSON.stringify(todo),
  }

  await s3.putObject(putParams).promise()
}

/**
 * 
 * @param {{id: number}} 
 */
exports.endpoint_deleteTodo = ({ id }) => {
  const params = {
    Bucket: bucket,
    Key: id,
  }
  await s3.deleteObject(params).promise()
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



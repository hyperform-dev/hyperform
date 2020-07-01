![Hyperform Banner](https://github.com/qngapparat/hyperform/blob/master/hyperform-banner.png)


<p align="center">A delightful FaaS deployer<br>For AWS Lambda & Google Cloud Functions</p>


## Install

```sh
$ npm install -g hyperform-cli
```

## Basic Example

#### Write code

```js
// index.js

function echo(input) {
  return {
    msg: `Hi from AWS Lambda or Google Cloud Functions!
          GET or POST body received: ${input}
         `
  }
}

// Hyperform looks for CommonJS exports that match '*endpoint*'
module.exports = {
  endpointEcho: echo 
}
```

#### Infer your cloud credentials

```sh
$ hf init
✓ Inferred cloud credentials
✓ Created hyperform.json
```

#### Deploy 


```sh 
$ hf deploy                                 # GET and POST-able
✓  AWS Lambda              endpointEcho   https://ltlpjhayh9.execute-api.us-east-2.amazonaws.com
✓  Google Cloud Functions  endpointEcho   https://us-central1-myproj.cloudfunctions.net/endpointEcho
```

#### Invoke 


```sh
#######
# GET #
#######

$ curl https://us-central1-myproj.cloudfunctions.net/endpointEcho?a=1
> {"Hi from AWS Lambda or Google Cloud Functions!
      GET or POST body received: {\"a\":1}}"

########
# POST #
########

$ curl \
  -X POST \
  -H "Content-Type: application/json" \ 
  -d '{"a":1}' \
  https://us-central1-myproj.cloudfunctions.net/endpointEcho
> {"Hi from AWS Lambda or Google Cloud Functions!
      GET or POST body received: {\"a\":1}}"
```

# Tips

* Hyperform deploys CommonJS exports named `*endpoint*` as functions to AWS Lambda or Google Cloud
* Import anything. Webpack is used to bundle all dependencies.
* Export anywhere. Your endpoints can be spread over multiple files.
* Included per default: `aws-sdk` and `@google/`.
* Your endpoints will receive one object: the parsed POST JSON body, or the parsed GET query string (or `{}`).


## More complex example

```js
// index.js

const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const bucket = 'my-todo-s3-bucket'

exports.endpoint_addTodo = async ({ id, text }) => {
  const todo = {
    id: id,
    text: text
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
    .then((res) => JSON.parse(Buffer.from(res.Body).toString()))

  return todo
}

```

That's it!

## Opening Issues

Feel free to open an issue if you find bugs or have questions or feature requests.

## Contributing

Always welcome! Please see CONTRIBUTING.md

## License

Apache 2.0
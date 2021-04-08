

![Hyperform Banner](https://github.com/qngapparat/hyperform/blob/master/hyperform-banner.png)


>A simple deployer for AWS Lambda, Google Cloud Functions


<!-- TODO bullet list (similar to JS cookie -->



<p align="center">
    <img src="https://user-images.githubusercontent.com/28540311/113403443-f3426100-93a6-11eb-9e51-5f048b77be88.gif" alt="GIF" />

</p>


## Install

```sh
$ npm install -g hyperform-cli
```


## Basic Usage


### ✍️ Write functions

You can name them anything. Just export them from the file.


```js
// file.js
function greetMorning(event) {
  return { greeting: `Good morning, ${event.name}` }
}

function greetEvening(event) {
  return { greeting: `Good evening, ${event.name}` }
}

module.exports = {
  greetMorning,
  greetEvening
} 
```

### 🔍 Infer your cloud credentials

Hyperform looks for credentials in a file called `hyperform.json`. 
<br>
`hf init` tries to create it automatically, by looking at `ENV`, then `.aws` and `.config/gcloud`.

```
// hyperform.json
{
  "amazon": {
    "aws_access_key_id": "",
    "aws_secret_access_key": "",
    "aws_default_region": ""
  }
  // or 
  "google": {
    "gc_project": "",
    "gc_client_email": "",
    "gc_private_key": ""
  }
}
```



### 🚀 Deploy the functions

`hf deploy` deploys each CommonJS export (`module.exports`, `exports`) as serverless function (256MB, 60 seconds timeout).
Specify `--url` to get an URL for each function you can `GET` and `POST` to. On AWS this creates an API Gateway API and binds it. On Google every function has an URL, so `--url` removes the IAM check to make it publicly callable.

```sh
$ hf deploy file.js --url

>>> 🟢 greetMorning https://ltirihayh9.execute-api.us-east-2.amazonaws.com/greetMorning 
>>> 🟢 greetEvening https://ltirihayh9.execute-api.us-east-2.amazonaws.com/greetEvening
```


### 📡 Call

You can call functions via HTTP (GET, POST), and use them internally (SNS, Google PubSub, Google Storage Trigger).
How you pass inputs to them depends on how you call them:

method |  example
---- | ----
GET | `curl ...?name=John`
POST | `curl  -d '{"name":"John"}' -X POST -H "Content-Type: application/json" ...`

<!--
For instance via GET:

```sh
curl https://us-central1-myproject.cloudfunctions.net/greet?name=John

>>> {"message":"Hi, John!"}
```

Or via POST: 

```sh
curl -X POST -d '{"name":"John"}' -H "Content-Type: application/json" https://us-central1-myproject.cloudfunctions.net/greet?name=John

>>> {"message":"Hi, John!"}
```
-->

## Advanced

#### Accessing HTTP headers

When you call your functions via HTTP, they receive { [headers](https://nodejs.org/api/http.html#http_message_headers), [method](https://nodejs.org/api/http.html#http_message_method) } as second argument. Otherwise it is `{}`

```js
function calledViaHTTP(input, http) {

  if(http.method != null) {
    console.log(`
      I was invoked via ${http.method}! 
      Headers: ${http.headers}
    `)
  }
}
```

## Tips

* The first argument always an object. It is the parsed POST body, the parsed GET query string, or the unchanged SNS, Google PubSub, Google Storage (...) event. The default is `{}`.
* The second argument, if called via HTTP is `{ method: GET|POST, headers: { ... } }`. The default is `{}`.
* You can import anything. Webpack is used to bundle all dependencies.
* Included per default are `aws-sdk` and `@google/`.


## Opening Issues

Feel free to open issues if you find bugs.

## Contributing

Always welcome! Please see CONTRIBUTING.md

## License

Apache 2.0

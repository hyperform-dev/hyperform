![Hyperform Banner](https://github.com/qngapparat/hyperform/blob/master/hyperform-banner.png)


<p align="center">A next-gen serverless deployer
<br>For AWS Lambda & Google Cloud Functions</p>

<!-- TODO bullet list (similar to JS cookie -->


## Install

```sh
$ npm install -g hyperform-cli
```


## Basic Usage

```
$ hf init 
$ hf deploy [--url]
```

### ✍️ Write functions


```js
function greetMorning(event) {
  return { greeting: `Good morning, ${event.name}`
}

function greetEvening(event) {
  return { greeting: `Good evening, ${event.name}`
}

module.exports = {
  greetMorning,
  greetEvening
} 
```

### 🔍 Infer your AWS or Google Cloud credentials

```sh
$ hf init
>>> ✓ Created hyperform.json
```

### 🚀 Deploy each

```sh
$ hf deploy --url index.js

>>> 🟢 greetMorning https://ltirihayh9.execute-api.us-east-2.amazonaws.com/greetMorning 
>>> 🟢 greetEvening https://ltirihayh9.execute-api.us-east-2.amazonaws.com/greetEvening
```

If you just want to use it internally, you can omit `--url`.

### 📡 Call

Your functions run the same anywhere, regardless whether you call them via GET, POST, or use them internally. 
How you pass input depends on how you call them.

For instance via GET:

```sh
curl  https://us-central1-myproject.cloudfunctions.net/greet?name=John

>>> {"message":"Hi, John!"}
```

Or via POST: 

```sh
curl -X POST -d '{"name":"John"}' -H "Content-Type: application/json" https://us-central1-myproject.cloudfunctions.net/greet?name=John

>>> {"message":"Hi, John!"}
```

## Advanced

#### Accessing HTTP headers

When you call your functions via HTTP, they receive HTTP details as second argument. Otherwise it is `{}`

```sh
function viaHTTP(input, http) {

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
* You can export anywhere. Your endpoints can be spread over multiple files.
* Included per default are `aws-sdk` and `@google/`.


## Opening Issues

Feel free to open issues if you find bugs.

## Contributing

Always welcome! Please see CONTRIBUTING.md

## License

Apache 2.0

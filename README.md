![Hyperform Banner](https://github.com/qngapparat/hyperform/blob/master/hyperform-banner.png)


<p align="center">A next-generation serverless deployer
<br>For AWS Lambda & Google Cloud Functions</p>

## Install

```sh
$ npm install -g hyperform-cli
```

## Synopsis

```
$ hf init    # Creates a `hyperform.json` config file
$ hf deploy  # Deploys all functions according to `hyperform.json`
```

## Basic Example

### ✍️ Write normal JavaScript


```js
/**
 * How you pass input to it depends on how you call it 
 **/
function greet({ name }, http) {
  if(http.method != null) {
    console.log(`Apparently I was invoked via ${http.method}`)
    console.log(`HTTP headers: ${http.headers}`)
  }

  return { greeting: `Hi from AWS Lambda or Google Cloud Functions, ${name} !` }
}


module.exports = {
// Hyperform looks for CommonJS exports matching '*endpoint*'
  endpointGreet: greet 
}
```

### 🔍 Infer your AWS or Google Cloud credentials

```sh
$ hf init

✓ Created hyperform.json
```

### 🚀 Deploy 

```sh 
$ hf deploy  

🟢 endpointEcho https://ltirihayh9.execute-api.us-east-2.amazonaws.com/endpointEcho
   # or
🟢 endpointEcho https://us-central1-myproject.cloudfunctions.net/endpointEcho
```

That's it!
<!-- 
## Invoke 

Your functions  detect from where they are invoked (GET, POST, Provider console, SNS event) so they always receive the same payload.

For instance, you can GET or POST to them.
Or you can use them internally with the provider.

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
``` -->

## 💡 Tips

* Hyperform deploys CommonJS exports named `*endpoint*` as functions to AWS Lambda or Google Cloud
* Import anything. Webpack is used to bundle all dependencies.
* Export anywhere. Your endpoints can be spread over multiple files.
* Included per default: `aws-sdk` and `@google/`.
* The first argument is the parsed POST body, the parsed GET query string, or the unchanged SNS, Google PubSub, Google Storage (...) event. The default is `{}`.
* The second argument if called via HTTP is `{ method: GET|POST, headers: { ... } }`.



## Opening Issues

Feel free to open issues if you find bugs.

## Contributing

Always welcome! Please see CONTRIBUTING.md

## License

Apache 2.0

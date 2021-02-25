![Hyperform Banner](https://github.com/qngapparat/hyperform/blob/master/hyperform-banner.png)


<p align="center">The easiest way to deploy your serverless code<br>For AWS Lambda & Google Cloud Functions</p>

## Install

```sh
$ npm install -g hyperform-cli
```

## Basic Example

#### Write normal code


```js
/**
 * This function will run on AWS Lambda or Google Cloud Functions
 * It does not care how it's called (GET, POST, AWS SNS, Google PubSub, Google Storage trigger ...)
 * 
 * @param {object} input 
 *   GET:  the parsed query string
 *   POST: the parsed body (query string or JSON)
 *   otherwise: what the provider passed
 * @param { {method: string, headers: object }? } http A subset of the HTTP headers if called via GET or POST
 **/

function greet({ name }, http) {
  return { greeting: `Hi from AWS Lambda or Google Cloud Functions, ${name} !` }
}


// Hyperform looks for CommonJS exports that match '*endpoint*'
module.exports = {
  endpointGreet: greet 
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
$ hf deploy  
   
   # If you use AWS Lambda    # The URLs are GET and POST-able
✓  endpointEcho 🟢 https://ltirihayh9.execute-api.us-east-2.amazonaws.com/endpointEcho
   # If you use Google Cloud Function
✓  endpointEcho 🟢 https://us-central1-myproject.cloudfunctions.net/endpointEcho
```

That's it!

#### Invoke 

Your functions  detect from where they are invoked (GET, POST, Provider console, SNS event) so they always receive the same payload.

For instance, you can GET or POST to them:

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
* Thefirst argument is the parsed POST body, the parsed GET query string, or the unchanged SNS, Google PubSub, Google Storage (...) event. The default is `{}`.
* The second argument if called via HTTP is `{ method: GET|POST, headers: { ... } }`.




## Opening Issues

Feel free to open an issue if you find bugs or have questions or feature requests.

## Contributing

Always welcome! Please see CONTRIBUTING.md

## License

Apache 2.0

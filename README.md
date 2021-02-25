![Hyperform Banner](https://github.com/qngapparat/hyperform/blob/master/hyperform-banner.png)


<p align="center">The easiest way to deploy your serverless code<br>For AWS Lambda & Google Cloud Functions</p>


## Install

```sh
$ npm install -g hyperform-cli
```

## Basic Example

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
$ hf deploy  
   
   # If you use AWS Lambda    # The URLs are GET and POST-able
✓  endpointEcho 🟢 https://ltirihayh9.execute-api.us-east-2.amazonaws.com/endpointEcho
   # If you use Google Cloud Function
✓  endpointEcho 🟢 https://us-central1-myproject.cloudfunctions.net/endpointEcho
```

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
* Your endpoints will receive one object: the parsed POST JSON body, or the parsed GET query string (or `{}`).


## Access HTTP headers

As second argument a subset of HTTP headers is passed, if you invoke the function via GET or POST. Namely `method` and `headers`. Otherwise it is `{}`.

```js
function endpointEcho(event, http) {
  console.log(http)
}

> {
  "method": "GET",
  "headers": {
    "host": "us-central1-firstnodefunc.cloudfunctions.net",
    "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36",
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    ...
  }
}
```



## Opening Issues

Feel free to open an issue if you find bugs or have questions or feature requests.

## Contributing

Always welcome! Please see CONTRIBUTING.md

## License

Apache 2.0

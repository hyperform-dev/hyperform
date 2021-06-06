

![Hyperform Banner](https://github.com/qngapparat/hyperform/blob/master/hyperform-banner.png)


>🧪 Write .js code, deploy as serverless functions 
>(to your AWS Lambda, Google Cloud Functions account)


![demomac2x](https://user-images.githubusercontent.com/28540311/120922670-c83bfc80-c6ca-11eb-9ad8-5688c242ed99.gif)

## Install

```sh
$ npm install -g hyperform-cli
```

## Usage

### Write a function

For AWS Lambda: 

```js
// somefile.js

exports.foo = (event, context, callback) => {
  context.succeed({
    message: "I'm Foo on AWS Lambda!"
  })
}
```

For Google Cloud Functions:

```js
// somefile.js
exports.foo = (req, res) => {
  let message = req.query.message || req.body.message || "I'm a Google Cloud Function, Foo";
  res.status(200).send(message);
};
```

### Create a `hyperform.json`

For AWS Lambda: 

```json
{
  "amazon": {
    "aws_access_key_id": "...",
    "aws_secret_access_key": "...",
    "aws_region": "..."
  }
}
```

For Google Cloud Functions: 


```json
{
  "google": {
    "gc_project": "...",
    "gc_region": "...",
  }
}
```


### Deploy


```
$ hyperform deploy somefile.js --amazon  
$ hyperform deploy somefile.js --google  
```

⚠️ Note that the entire folder containing `hyperform.json` will be deployed, minus `.git`, `.gitignore`, `hyperform.json`.
This means you can use npm packages (`node_modules`) as normal.



### Deploy & get URL


```
$ hyperform deploy somefile.js --amazon --url
$ hyperform deploy somefile.js --google --url  
```

This gives the function an **unprotected** URL to GET and POST to. On Amazon, it adds a public API gateway route, on Google Cloud it adds `allUsers` to the group "Cloud Function Invokers" to the function.


## Hints

* New functions are deployed with 256MB RAM, 60s timeouts 
* Multiple functions can be deployed at once, just specify them with `exports`
* The entire folder containing `hyperform.json` will be deployed with each function

## Opening Issues

Feel free to open issues if you find bugs.

## Contributing

Always welcome! Please see CONTRIBUTING.md

## License

Apache 2.0

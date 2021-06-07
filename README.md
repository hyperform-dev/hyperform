

![Hyperform Banner](https://github.com/qngapparat/hyperform/blob/master/hyperform-banner.png)


> 🧪 Lightweight serverless framework for NodeJS

* **Unopinionated** (any NodeJS code works)
* **1-click deploy** (1 command)
* **Lightweight** (no wrapping)
* **Multi-Cloud** (for AWS & Google Cloud)
* **Maintains** (provider's conventions)

## Install

```sh
$ npm install -g hyperform-cli
```

Hyperform works for AWS Lambda & Google Cloud Functions.

## Basic Example (AWS Lambda)


```js
// somefile.js

exports.foo = (event, context, callback) => {
  context.succeed({
    message: "I'm Foo on AWS Lambda!"
  })
}
```

```json 
// hyperform.json

{
  "amazon": {
    "aws_access_key_id": "...",
    "aws_secret_access_key": "...",
    "aws_region": "us-east-2"
  }
}
```

In the Terminal:

``` 
$ hyperform deploy somefile.js --amazon --url
```

Output: 

``` 
                     # GET and POST-able
$ 🟢 foo on AWS Lambda https://w3g434h.execute-api.us-east-2.amazonaws.com/foo
```

## Hints & Caveats

* New functions are deployed with 256MB RAM, 60s timeouts 
* The flag `--url` creates **unprotected** URLs to the functions. Anyone with these URLs can invoke your functions
* The entire folder containing `hyperform.json` will be deployed with each function


## Full AWS Lambda Example

Everything works like a normal NodeJS app. 

The entire folder containing `hyperform.json` is uploaded, so you can use NPM packages, use external files, (...) just like normal.

```js
// AWS Lambda example
// somefile.js

/* 
.
├── node_modules
├── package-lock.json
├── package.json
├── some
│   └── pic.png
└── somefile.js
*/ 

// Use npm packages as normal
const package = require('lodash')

// Use external files as normal 
const externalfile = fs.readFileSync('./some/pic.png')

// Export each function using 'exports'
exports.foo = (event, context, callback) => {
  context.succeed({
    message: "I'm Foo on AWS Lambda!"
  })
}

exports.bar = (event, context, callback) => {
  context.succeed({
    message: "I'm Bar on AWS Lambda!"
  })
}
```

### Create a `hyperform.json` 

```json
{
  "amazon": {
    "aws_access_key_id": "...",
    "aws_secret_access_key": "...",
    "aws_region": "..."
  }
}
```

### Deploy to AWS Lambda

```
$ hyperform deploy ./somefile.js --amazon       # Deploy
$ hyperform deploy ./somefile.js --amazon --url # Deploy & get URL via API Gateway
```

⚠️ Note that the entire folder containing `hyperform.json` will be deployed, minus `.git`, `.gitignore`, `hyperform.json`.

The flag `--url` creates an public, **unprotected** API Gateway route to your function, that you can `GET` and `POST` to.

## Full Google Cloud Functions Example 

Everything works like a normal NodeJS app. 

The entire folder containing `hyperform.json` is uploaded, so you can use NPM packages, use external files, (...) just like normal.

Google Cloud passes Express objects to your functions (`req`, `res`). 

```js
// Google Cloud Functions Example
// somefile.js

/* 
.
├── node_modules
├── package-lock.json
├── package.json
├── some
│   └── pic.png
└── somefile.js
*/ 


// Use npm packages as normal
const package = require('lodash')

// Use external files as normal 
const externalfile = fs.readFileSync('./some/pic.png')

exports.foo = (req, res) => {
  let message = req.query.message || req.body.message || "I'm a Google Cloud Function, Foo";
  res.status(200).send(message);
};

exports.bar = (req, res) => {
  let message = req.query.message || req.body.message || "I'm a Google Cloud Function, Bar";
  res.status(200).send(message);
};
```



### Create a `hyperform.json` 

```json
{
  "google": {
    "gc_project": "...",
    "gc_region": "...",
  }
}
```

### FAQ

**Where does deployment happen**

It's a client-side tool, so on your computer. It uses the credentials it finds in `hyperform.json`

**How does `--url` create URLs?**

On AWS, it creates an API Gateway API (called `hf`), and a `GET` and `POST` route to your function. 

On Google Cloud, it removes IAM checking from the function by adding `allUsers` to the group "Cloud Functions Invoker" of that function.

Note that in both cases, *anyone with the URL can invoke your function. Make sure to add Authentication logic inside your function*, if needed. 



## Opening Issues

Feel free to open issues if you find bugs.

## Contributing

Always welcome ❤️ Please see CONTRIBUTING.md

## License

Apache 2.0

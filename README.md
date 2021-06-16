

![Hyperform Banner](https://github.com/qngapparat/hyperform/blob/master/hyperform-banner.png)


> ⚡ Lightweight serverless framework for NodeJS

* **Unopinionated** (Any JS code works)
* **Lightweight** (no wrapping)
* **1-click deploy** (1 command)
* **Multi-Cloud** (for AWS & Google Cloud)
* **Maintains** (provider's conventions)


## Install

```sh
$ npm install -g hyperform-cli
```



## Usage


* Everything works like a normal NodeJS app. You can use NPM packages, external files, assets, since the entire folder containing `hyperform.json` is included with each function.

### AWS Lambda


```js
// somefile.js

// AWS Lambda uses 'event', 'context', and 'callback'  convention
// Learn more: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html

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

// ... 
```

Create a `hyperform.json` in the current folder, with your AWS credentials:

```json 
{
  "amazon": {
    "aws_access_key_id": "...",
    "aws_secret_access_key": "...",
    "aws_region": "..."
  }
}
```

In the terminal, type:

``` 
$ hyperform deploy somefile.js --amazon --url
                     # GET and POST-able
  > 🟢 foo https://w3g434h.execute-api.us-east-2.amazonaws.com/foo
  > 🟢 bar https://w3g434h.execute-api.us-east-2.amazonaws.com/bar

```

... and your functions are deployed & invokable via URL.



### Google Cloud Functions


```js
// somefile.js

// Google Cloud uses Express's 'Request' and 'Response' convention
// Learn more: https://expressjs.com/en/api.html#req 
//             https://expressjs.com/en/api.html#res

exports.foo = (req, res) => {
  let message = req.query.message || req.body.message || "I'm a Google Cloud Function, Foo";
  res.status(200).send(message);
};

exports.bar = (req, res) => {
  let message = req.query.message || req.body.message || "I'm a Google Cloud Function, Bar";
  res.status(200).send(message);
};
```


Create a `hyperform.json` in the current folder with your Google Cloud credentials:

```json 
{
  "google": {
    "gc_project": "...",
    "gc_region": "...",
  }
}
```

In the terminal, type:

``` 
$ hyperform deploy somefile.js --google --url    
                        # GET and POST-able
  > 🟢 foo https://us-central1-someproject-153dg2.cloudfunctions.net/foo 
  > 🟢 bar https://us-central1-someproject-153dg2.cloudfunctions.net/bar 

```

... and your functions are deployed and invokable via URL.


## Hints & Caveats

* New functions are deployed with 256MB RAM, 60s timeouts 
* The flag `--url` creates **unprotected** URLs to the functions. Anyone with these URLs can invoke your functions
* The entire folder containing `hyperform.json` will be deployed with each function, so you can use NPM packages, external files (...) just like normal.



### FAQ

**Where does deployment happen?**

It's a client-side tool, so on your computer. It uses the credentials it finds in `hyperform.json`


**Can I use NPM packages, external files, (...) ?**

Yes. The entire folder where `hyperform.json` is is uploaded, excluding `.git`, `.gitignore`, `hyperform.json`, and for Google Cloud `node_modules` (Google Cloud installs NPM dependencies freshly from `package.json`). So everything works like a normal NodeJS app.

**How does `--url` create URLs?**

On AWS, it creates an API Gateway API (called `hf`), and a `GET` and `POST` route to your function. 

On Google Cloud, it removes IAM checking from the function by adding `allUsers` to the group "Cloud Functions Invoker" of that function.

Note that in both cases, **anyone with the URL can invoke your function. Make sure to add Authentication logic inside your function**, if needed. 



## Opening Issues

Feel free to open issues if you find bugs.

## Contributing

Always welcome ❤️ Please see CONTRIBUTING.md

## License

Apache 2.0



![Hyperform Banner](https://github.com/qngapparat/hyperform/blob/master/hyperform-banner.png)


> ⚡ Lightweight serverless framework for NodeJS

* **Any JS code works** (Unopinionated)
* **1-click deploy** (1 command)
* **Lightweight** (no wrapping)
* **Multi-Cloud** (for AWS & Google Cloud)
* **Maintains** (provider's conventions)

## Install

```sh
$ npm install -g hyperform-cli
```


## Usage (AWS Lambda)


```js
// somefile.js

// Everything works like a normal NodeJS app. 
// Use NPM packages, external files, assets, ...
// ...since the entire folder containing `hyperform.json` is included with each function.

exports.foo = (event, context, callback) => {

// 'event', 'context', 'callback' is AWS Lambda's convention
// Learn more: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html

  context.succeed({
    message: "I'm Foo on AWS Lambda!"
  })
}

// ... 
```

Create a `hyperform.json` with your AWS Lambda credentials. You can get new credentials from your AWS Developer Console. 

```json 
{
  "amazon": {
    "aws_access_key_id": "...",
    "aws_secret_access_key": "...",
    "aws_region": "..."
  }
}
```

Then, to deploy and get an URL, simply type: 

``` 
$ hyperform deploy somefile.js --amazon --url
```

... and your functions are deployed: 

``` 
         # URL is created via API Gateway (GET and POST-able)
$ 🟢 foo https://w3g434h.execute-api.us-east-2.amazonaws.com/foo
```




## Usage (Google Cloud Functions)



```js
// somefile.js

// Everything works like a normal NodeJS app. 
// Use NPM packages, external files, assets, ...
// ...since the entire folder containing `hyperform.json` is included with each function.

exports.foo = (req, res) => {

  // Google uses Express's 'Request' and 'Response' convention
  // Learn more: https://expressjs.com/en/api.html#req 
  //             https://expressjs.com/en/api.html#res

  let message = req.query.message || req.body.message || "I'm a Google Cloud Function, Foo";
  res.status(200).send(message);
};
// ... more functions
```


Create a hyperform.json with your Google Cloud Service account credentials. You can get new credentials from your Google Cloud Console.



```json 
{
  "google": {
    "gc_project": "...",
    "gc_region": "...",
  }
}
```

Then, to deploy and get an URL, simply type: 

``` 
$ hyperform deploy somefile.js --google --url
```

... and your functions are deployed:

``` 
         # URL is GET and POST-able
$ 🟢 foo https://us-central1-someproject-153dg2.cloudfunctions.net/foo 
```

## Hints & Caveats

* New functions are deployed with 256MB RAM, 60s timeouts 
* The flag `--url` creates **unprotected** URLs to the functions. Anyone with these URLs can invoke your functions
* The entire folder containing `hyperform.json` will be deployed with each function, so you can use NPM packages, external files (...) just like normal.


### FAQ

**Where are functions deployed to?**

* On AWS: To AWS Lambda
* On Google Cloud: To Google Cloud Functions

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

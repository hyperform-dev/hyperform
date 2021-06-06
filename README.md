

![Hyperform Banner](https://github.com/qngapparat/hyperform/blob/master/hyperform-banner.png)


>Write .js code, deploy as serverless functions (to your AWS Lambda, Google Cloud Functions account)


![Hyperform Demo](https://github.com/qngapparat/hyperform/blob/master/demomac.mov)


## Install

```sh
$ npm install -g hyperform-cli
```

## Usage

### 🚀 Deploy to AWS Lambda

Create a `hyperform.json` in your folder with the these fields:

```json
{
  "amazon": {
    "aws_access_key_id": "...",
    "aws_secret_access_key": "...",
    "aws_region": "..."
  }
}
```

Export your AWS Lambda functions from any file via `exports` or `module.exports`. You can import NPM packages and other files just like normal, since the entire folder will be uploaded (excluding `.git`, `.github`).

More info about writing good AWS Lambda functions can be found at [NodeJS function handler | AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html)
 
```js
// file.js
exports.greetMorning = (event, context, callback) => {
  context.succeed({
    message: "Good morning from AWS Lambda!"
  })
}

exports.greetEvening = (event, context, callback) => {
  context.succeed({
    message: "Good evening from AWS Lambda!"
  })
}
```

⚠️ Note that the entire folder containing `hyperform.json` will be uploaded with the function.

Deploy or update all functions with 

```
$ hf deploy ./file.js --amazon
>>> 🟢 Deployed greetMorning to AWS Lambda
>>> 🟢 Deployed greetEvening to AWS Lambda
```

New functions are deployed with 256MB RAM, 60 second timeout.

### 🚀 Deploy to Google Cloud Functions

Create a `hyperform.json` in your folder with these fields:

```json
{
  "google": {
    "gc_project": "...",
    "gc_region": "...",
  }
}
```

Hyperform uses the default Google Cloud account configured in the CLI (check with `$ gcloud config get-value account`).

Export your Google Cloud Functions from any file via `exports` or `module.exports`. You can import NPM packages and other files just like normal, since the entire folder will be uploaded (excluding `.git`, `.github`, and `node_modules` which Google installs).

On how to write good Google Cloud Functions, see [Node.js Quickstart | Google Cloud](https://cloud.google.com/functions/docs/quickstart-nodejs)



```js
// file.js
exports.greetMorning = (req, res) => {
  let message = req.query.message || req.body.message || 'Good evening from Google Cloud Functions';
  res.status(200).send(message);
};

exports.greetEvening = (req, res) => {
  let message = req.query.message || req.body.message || 'Good evening from Google Cloud Functions!';
  res.status(200).send(message);
};
```

⚠️ Note that the entire folder containing `hyperform.json` will be uploaded with the function.


Deploy or update all functions with

```
$ hf deploy ./file.js --google
>>> 🟢 Deployed greetMorning to Google Cloud Functions
>>> 🟢 Deployed greetEvening to Google Cloud Functions
```
New functions are deployed with 256MB RAM, 60 second timeout.

## Opening Issues

Feel free to open issues if you find bugs.

## Contributing

Always welcome! Please see CONTRIBUTING.md

## License

Apache 2.0

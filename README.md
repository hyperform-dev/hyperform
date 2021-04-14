

![Hyperform Banner](https://github.com/qngapparat/hyperform/blob/master/hyperform-banner.png)


>Deploy a directory as serverless functions
## Install

```sh
$ npm install -g hyperform-cli
```

## Usage

### Deploy to AWS Lambda

Create a `hyperform.json` in the current directory with `$ hf init` (or per hand).

```
{
  "amazon": {
    "aws_access_key_id": "",
    "aws_secret_access_key": "",
    "aws_default_region": ""
  }
}
```

Export your AWS Lambda functions from any file via `exports` or `module.exports`. The entire folder with `hyperform.json` will be uploaded (excluding `.git`, `.github`), so you can import npm packages spread your code just like normal.

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

Deploy or update all functions with the following command.
The setting for new functions is 256MB RAM, 60 second timeout.

`$ hf deploy ./file.js`

You will see something like this:

```
🟢 Deployed greetMorning to AWS Lambda
🟢 Deployed greetEvening to AWS Lambda
```

### Deploy to Google Cloud Functions

Hyperform uses your default Google project and region configured in your CLI.
You can view it with `gcloud config list`


Export your Google Cloud Functions from any file via `exports` or `module.exports`. The entire folder with `hyperform.json` will be uploaded (excluding `node_modules` which Google installs, `.git`, `.github`), so you can import npm packages and other files just like normal.

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

Deploy or update all functions with the following command.
New functions are deployed with 256MB RAM, 60 second timeout.

`$ hf deploy ./file.js`

You will see something like this:

```
🟢 Deployed greetMorning to Google Cloud Functions
🟢 Deployed greetEvening to Google Cloud Functions
```

## Opening Issues

Feel free to open issues if you find bugs.

## Contributing

Always welcome! Please see CONTRIBUTING.md

## License

Apache 2.0

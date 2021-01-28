![Hyperform Banner](https://github.com/qngapparat/hyperform/blob/master/hyperform-banner.png)

## 📦 Install

```sh
$ npm install -g hyperform-cli
```
TODO simple serverless app instead,
TODO put code first

## 🧪 Basic Example

#### 1. Create a `hyperform.json`
```
hyperform init
✓ Inferred cloud credentials
✓ Created hyperform.json
``` 

:warning: You should not commit `hyperform.json` to version control. Hyperform will add `hyperform.json` to `.gitignore`.

#### 2. Mark endpoints in your code

To tell Hyperform which endpoints to deploy, include `endpoint` in their name, and export them using `exports` or `module.exports`:

```js
exports.endpointGreet = ({ name }) => {
 return { msg: `Hello, ${name}!` }
}
```

#### 3. Deploy to the Cloud

```sh 
$ hyperform deploy --allow-unauthenticated

✓  Amazon  endpointGreet https://gmlpjhayh9.execute-api.us-east-2.amazonaws.com
✓  Google  endpointGreet https://us-central1-firstnodefunc.cloudfunctions.net/endpointGreet


```



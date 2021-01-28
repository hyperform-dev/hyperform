![Hyperform Banner](https://github.com/qngapparat/hyperform/blob/master/hyperform-banner.png)

## 📦 Install

```sh
npm install -g hyperform-cli
```

## 🧪 Basic Usage

### Create configuration file

Hyperform deploys code to the cloud accounts it finds in `hyperform.json`:

```
 {
  "amazon": {
    "aws_access_key_id": "XXXXXXXXXXXXXX",
    "aws_secret_access_key": "YYYYYYYYYYYYYYYYYYYYYYYYY",
    "aws_default_region": "ZZZZZZZZZ"
  },
  "google": {
    "gc_project": "",
    "gc_client_email": "",
    "gc_private_key": ""
  }
}
```

You can create one with:

```
hyperform init
> Created hyperform.json
``` 

:warning: Never commit `hyperform.json` to version control. Hyperform will add it automatically to your `.gitignore`.

## Example

```js
// index.js

function 

```

Create a configuration file for this directory.

:warning: Never commit `hyperform.json` to version control. It is aut

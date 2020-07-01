# deply

A batch deployer for AWS Lambda.

## Install

```
$ npm install -g deply # requires node v12.19.0 or later
```

## Usage

```
$ deply init
```

Place your functions in separate folders:

```
└── functions
    ├── foolambda
    │   └── index.js
    └── barlambda
        └── index.js
```

Edit `deploy.json`:


```
[
  {
    "forEachIn": "functions",
    "do": "zip -r deploypackage.zip .",
    "upload": "deploypackage.zip",
    "config": {
      "amazon": {
        "role": "YOUR_LAMBDA_ROLE_ARN"
      }
    }
  }
]
```

Run `deply`:

```
$ deply
Deployed foolambda in js
Deployed barlambda in js
```

# `deploy.json` Defaults 

```
{
  // role: Must be specified
  // region: Your AWS CLI default region
  ram: 128,
  timeout: 60
}
```


## Tips

* `ram` and `timeout` are only consulted when the function is deployed for the first time.
* `deply` tries to infer the language of every Lambda.
If it did so incorrectly, please include `$ tree` in the GitHub issue.
* You don't need to do any cleaning in "do", `deply` removes the uploadable afterwards.
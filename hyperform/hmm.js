const { execSync } = require('child_process')

const res = execSync('gcloud functions deploy somefunc --region us-central1 --trigger-http --runtime nodejs12 --entry-point endpoint_hello --source ./lambs/nested/very --stage-bucket jak-functions-stage-bucket', { encoding: 'utf-8' })
console.log(res)

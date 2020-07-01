const { runUploadAmazon } = require('./amazon')

const uploaders = {
  amazon: function (task, name, pathOfUploadable, path) {
    return runUploadAmazon(task, name, pathOfUploadable, path)
  },
  google: function (task, name, pathOfUploadable, path) {
    throw new Error('google uploader not yet implemented')
  },
}

function runUpload(task, name, pathOfUploadable, path) {
  // see deploy.json to understand this
  const providerNames = Object.keys(task.config)
  providerNames.map((pn) => {
    if (!uploaders[pn]) {
      throw new Error(`UNIMEPLEMENTED: uploader for ${pn} (wished for in deploy.json)`)
    }
    // invoke the correct uploader, return promise
    return uploaders[pn](task, name, pathOfUploadable, path)
  })
}

module.exports = {
  runUpload,
}

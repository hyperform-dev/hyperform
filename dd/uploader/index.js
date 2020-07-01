const { runUploadAmazon } = require('./amazon/index')

const uploaders = {
  amazon: function (options) {
    return runUploadAmazon(options)
  },
  google: function (options) {
    throw new Error('google uploader not yet implemented')
  },
}

// function build(obj) {
//   // find out which builder to use
//   const nodetype = detectnodetype(obj)
//   // build the node function
//   console.log('BUILDING ', nodetype)
//   return nodebuilders[nodetype].build(obj)
// }

/**
 * Upload a uploadable to all given providers (currently only amazon)
 * @param {{task: Object, name: string, pathOfUploadable: string, path: string}} options 
 */
function runUpload(options) {
  // find out which uploaders to use (all)
  const providerNames = Object.keys(options.task.config)

  return Promise.all(providerNames.map((pn) => {
    if (!uploaders[pn]) {
      throw new Error(`UNIMEPLEMENTED: uploader for ${pn} (wished for in deploy.json)`)
    }
    // invoke uploader, return promise
    return uploaders[pn](options)
  }))
}

module.exports = {
  runUpload,
}

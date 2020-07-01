const { spawn } = require('child_process')

/**
 * @returns {Promise<name>} Promise that if fn found, resolves to it's name, rejects on not found or taking too long
 * @param {*} name 
 */
function amazonQuery(name) {
  console.log(`querying for ${name}`)
  if (/^arn:(aws|aws-cn|aws-us-gov):lambda:/.test(name) === true) {
    return Promise.resolve(name)
  }

  return new Promise((resolve, reject) => {
    // query amazon by name for that fn
    const queryproc = spawn('aws', ['lambda', 'wait', 'function-exists', '--function-name', name])
    
    // cap the query to 5 seconds
    const timeoutHandle = setTimeout(() => {
      queryproc.kill('SIGINT')
      reject(new Error(`FN probably does not exist, Amazon Name resolving took too long, canceled: ${name}`))
    }, 2000);
    
    // If we receive a positive / negative answer before that time limit:
    queryproc.on('close', (code) => {
      if (code === 0) {
        // FN EXISTS
        // TODO currently 'myfn1' is sufficient. Maybe later enforce ARN
        //  in pro version with multiple users may not be enough to identify
        // don't forget to clear timer
        clearTimeout(timeoutHandle)
        resolve(name)
      } else {
        // FN DOES NOT EXIST
        // don't forget to clear timer
        clearTimeout(timeoutHandle)
        reject(new Error(`Amazon: Query could not find ${name}`))
      }
    });
  })
}

module.exports = {
  amazonQuery,
}

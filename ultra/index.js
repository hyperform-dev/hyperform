const { Watch } = require('./watcher/index')
const { syncAmazon } = require('./syncer/amazon/index')

// TODO use chokidar instead of watchman
/**
 * 
 * 
 * @param {*} dir 
 * @param {*} bucket 
 */
async function keepSync(dir, bucket) {
  // start watcher
  const w = new Watch(dir)

  // when a file changes, upload to amazon
  w.onChange((res) => syncAmazon(res.path, bucket))
}

module.exports = {
  keepSync,
}

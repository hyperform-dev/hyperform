const { Watch } = require('./watcher/index')
const { syncAmazon } = require('./syncer/index')

/**
 * 
 * @param {*} dir 
 * @param {*} bucket 
 */
async function keepSync(dir, bucket) {
  // start watcher
  const w = new Watch(dir)

  await w.start()

  // when a file changes, upload to amazon
  w.onChange((res) => syncAmazon(res.path, bucket))
}

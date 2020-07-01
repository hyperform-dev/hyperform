const { Watch } = require('./watcher/index')
const { syncAmazon } = require('./syncer/index')

async function keepSync(dir) {
  // start watcher
  console.time('Watcher start')
  const w = new Watch(dir)

  await w.start()

  console.timeEnd('Watcher start')

  // when a file changes, upload to amazon
  w.onChange((res) => syncAmazon(res.path))
}

keepSync('/home/qng/cloudkernel/ultra/zoo')

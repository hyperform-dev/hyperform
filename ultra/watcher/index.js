const chokidar = require('chokidar')

class Watch { 
  constructor(dir) {
    if (!dir) {
      throw new Error('DEV: Watch: must specify dir to watch')
    }
    this.watch = chokidar.watch(dir, {
      ignored: (path) => /node_modules/.test(path),
      followSymlinks: false,
    })
  }

  /**
   * Installs a callback on any file change
   * @param {({event: string, path: string}) => {}} callback Callback that gets called anytime a file changes w its details
   */
  onAny(callback) {
    this.watch.on('all', (event, path) => {
      callback({
        event, 
        path,
      })
    })
  }

  stop() {
    return this.watch.close()
  }
}

module.exports = {
  Watch,
}

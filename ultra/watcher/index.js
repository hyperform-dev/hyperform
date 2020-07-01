const chokidar = require('chokidar')

/**
 * Used to watch a directory for changes
 */
class Watch { 
  constructor(dir) {
    if (!dir) {
      throw new Error('DEV: Watch: must specify dir to watch')
    }
    this.watch = chokidar.watch(dir, {
      ignored: [/node_modules/], // ignore node_modules, /(^|[\/\\])\../ dotfiles too?
      followSymlinks: false,
    })
  }

  /**
   * Installs a callback on any file change
   * @param {({event: string, path: string}) => {}} callback Callback that gets called anytime a file changes w its details
   */
  onChange(callback) {
    this.watch.on('all', (event, path) => { 
      // ignore dir creation/deletion        
      // TODO ignores file del. files will never be del from s3 so maybe later delete from s3 too on file del
      if (event === 'addDir' || event === 'unlinkDir' || event === 'unlink') {
        return 
      }
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

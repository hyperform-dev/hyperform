const watchman = require('fb-watchman');
const path = require('path')

class Watch {
  constructor(dir) {
    if (!dir) {
      throw new Error('Watch: pass it a dir')
    }
    this.dir = dir
    this.watchmanclient = new watchman.Client()
    this.resp = null // what startWatch returns
  }

  start() {
    return this._startWatch()
      .then(() => this._subscribe())
  }

  /**
   * Starts watch and sets Watch.resp
   * @returns {void}
   */
  _startWatch() {
    return new Promise((resolve, reject) => {
      this.watchmanclient.command(['watch-project', this.dir], (err, resp) => {
        if (err) {
          console.error('Error initiating watch:', err);
          reject(err)
        }

        if ('warning' in resp) {
          console.log('warning: ', resp.warning);
        }

        this.resp = resp
        resolve()
      })
    })
  }

  /**
   * Installs a custom handler to call on a file change
   * @param {({ path, millis}) => {}} callback Func that will be called with the changed file's details
   */
  onChange(callback) {
    // install custom handler
    // lmao @ that event naming, should be 'data' or 'change' or something
    this.watchmanclient.on('subscription', (data) => {
      if (data.subscription !== 'mysubscription') return; // TODO allow multiple watchers on PC? If yes, replace with unique id
      data.files.forEach((file) => {
        const p = path.join(this.dir, file.name)
        const ms = file.mtime_ms
        callback({
          path: p,
          millis: ms,
        }) 
      })
    })
  }

  /**
   * 
   */
  _subscribe() {
    if (!this.resp || !this.resp.watch) {
      throw new Error('Could not subscribe: watch was not started, or had started improperly')
    }
  
    const params = {
      expression: ['allof', ['match', '*.js']],
      // Which fields we're interested in
      fields: ['name', 'size', 'mtime_ms', 'exists', 'type'],
    };
    if (this.resp.relative_path) {
      params.relative_root = this.resp.relative_path;
    }

    // subscribe
    this.watchmanclient.command(['subscribe', this.resp.watch, 'mysubscription', params], (err) => {
      if (err) {
        console.log('failed to subscribe')
        throw err
      }
    })
  }
}

module.exports = {
  Watch,
}

const w = new Watch('/home/qng/tm')
w.start().then(() => {
  w.onChange((res) => console.log(res))
})

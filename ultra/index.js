const watchman = require('fb-watchman');

const watchmanclient = new watchman.Client();

const directory_of_interest = '/home/qng/cloudkernel/ultra/zoo'

function startWatch(dir) {
  return new Promise((resolve, reject) => {
    watchmanclient.command(['watch-project', dir], (err, resp) => {
      if (err) {
        console.error('Error initiating watch:', err);
        reject(err)
      }

      if ('warning' in resp) {
        console.log('warning: ', resp.warning);
      }

      console.log('watch established on ', resp.watch,
        ' relative_path', resp.relative_path);
      resolve(resp)
    })
  })
}

/**
 * 
 * @param {object} resp What startWatch returns
 */
function subscribe(resp) {
  if (!resp.watch || !resp.relative_path) {
    throw new Error('Startwatch resp was invalid. Could not start watcher')
  }

  const params = {
    expression: ['allof', ['match', '*.js']],
    // Which fields we're interested in
    fields: ['name', 'size', 'mtime_ms', 'exists', 'type'],
  };
  if (resp.relative_path) {
    params.relative_root = resp.relative_path;
  }

  // subscribe
  watchmanclient.command(['subscribe', resp.watch, 'mysubscription', params], (err, data) => {
    if (err) {
      console.log('failed to subscribe')
      throw err
    }
  })

  // install handler callback
  // lmao @ that event naming, should be 'data' or 'change' or something
  watchmanclient.on('subscription', (data) => {
    if (data.subscription !== 'mysubscription') return;

    data.files.forEach((file) => {
      console.log(`file that interests us changed: ${file.name}`, file.mtime_ms)
      console.log(file)
    })
  })
}

startWatch(directory_of_interest)
  .then((res) => subscribe(res))

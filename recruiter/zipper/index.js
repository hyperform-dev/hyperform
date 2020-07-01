const compressing = require('compressing')
const fsp = require('fs').promises
const os = require('os')
const path = require('path')
const { Readable } = require('stream')

/**
 * Zips given code as 'index.js' to deploypackage.zip
 * @returns {string} path to the created zip
 * @param {string} code index.js code
 */
async function zip(code) {
  const uid = `${Math.ceil(Math.random() * 10000)}`
  console.time(`zip-${uid}`)
  // create tmp dir
  const outdir = await fsp.mkdtemp(path.join(os.tmpdir(), 'zipped-'))
  const outpath = path.join(outdir, 'deploypackage.zip')

  // set up stream
  const s = new Readable();
  s._read = () => {}; // redundant? see update below
  s.push(code);
  s.push(null);
  // It's a transform stream, so you can pipe to it
  await compressing.zip.compressFile(s, outpath, { relativePath: 'index.js' })
  console.timeEnd(`zip-${uid}`)
  return outpath
}

module.exports = {
  zip,
}

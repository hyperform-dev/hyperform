const fsp = require('fs').promises
const fs = require('fs')
const os = require('os')
const path = require('path')

const { Readable } = require('stream')

const yazl = require('yazl')
/**
 * Zips given code as 'index.js' to deploypackage.zip
 * @returns {string} path to the created zip
 * @param {string} code index.js code
 */
async function zip(code) {
  const uid = `${Math.ceil(Math.random() * 10000)}`
  const zipfile = new yazl.ZipFile()

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
  // zipfile.addReadStream(s, 'index.js')
  
  zipfile.outputStream.pipe(fs.createWriteStream(outpath))
  zipfile.addReadStream(s, 'index.js'); // place code in index.js inside zip
  zipfile.end()

  console.timeEnd(`zip-${uid}`)
  return outpath
}

module.exports = {
  zip,
}

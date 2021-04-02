const fsp = require('fs').promises
const fs = require('fs')
const os = require('os')
const path = require('path')

const { Readable } = require('stream')

const yazl = require('yazl')
/**
 * @description Creates a .zip that contains given filecontents, within given filenames. All at the zip root
 * @param {{}} filesobj For instance { 'file.txt': 'abc' }
 * @returns {Promise<string>} Path to the created .zip
 */
async function zip(filesobj) {
  const uid = `${Math.ceil(Math.random() * 10000)}`
  const zipfile = new yazl.ZipFile()

  console.time(`zip-${uid}`)
  // create tmp dir
  const outdir = await fsp.mkdtemp(path.join(os.tmpdir(), 'zipped-'))
  const outpath = path.join(outdir, 'deploypackage.zip')

  zipfile.outputStream.pipe(fs.createWriteStream(outpath))

  // filesobj is like { 'file.txt': 'abc', 'file2.txt': '123' }
  // for each such destination file,...
  const fnames = Object.keys(filesobj)
  for (let i = 0; i < fnames.length; i += 1) {
    const fname = fnames[i]
    const fcontent = filesobj[fname]

    // set up stream
    const s = new Readable();
    s._read = () => {};
    s.push(fcontent);
    s.push(null);

    // In zip, set last-modified header to 01-01-2020
    // this way, rezipping identical files is deterministic (gives the same codesha256)
    // that way we can skip uploading zips that haven't changed
    const options = {
      mtime: new Date(1577836),
    }

    zipfile.addReadStream(s, fname, options); // place code in index.js inside zip
    console.log(`created ${fname} in zip`)
  }

  zipfile.end()
  
  console.timeEnd(`zip-${uid}`)
  return outpath
}

module.exports = {
  zip,
}

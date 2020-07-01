/* eslint-disable global-require, import/no-dynamic-require */

const path = require('path')
const fsp = require('fs').promises
const os = require('os')
const compressing = require('compressing')
// TODO clean up dependencies
const { bundle } = require('./bundler/index')
const { getJsFilePaths, getNamedExports } = require('./discoverer/index')

/**
     * Creates zip of a certain bundle, right next to it.
     * @returns {Promise<string>} path to the zip
     * @param {{names: string[], bundlepath: string}} r 
     */
async function createZip(r) {
  const outpath = path.join(
    path.dirname(r.bundlepath),
    // this must be the prefix of handlers when deploying !
    'deploypackage.zip',
  )
  const inpath = r.bundlepath 
  await compressing.zip.compressFile(inpath, outpath)
  return outpath
}

async function main(root) {
  // paths to relevant js files
  /*
  eg 
  ├── ayy.js
  ├── demo.js
  └── index.js
  */
  const jspaths = await getJsFilePaths(root)

  // make a place for all our bundles
  /*
  eg 
  /tmp
   └── 81723
   */
  const bundledir = await fsp.mkdir(
    path.join(
      os.tmpdir(),
      `${Math.ceil(Math.random() * 100000)}`,
    ),
    { recursive: true },
  )
  
  // bundle js files and remember which named exports they each have
  let res = await Promise.all(
    jspaths.map(async (jspath) => {
      // import & check for named exports
      // TOD (also runs top-level code lol)
      const namedexpkeys = getNamedExports(jspath)
      const filename = path.basename(jspath)

      // make subdir for that bundle
      /*
      eg
      /tmp
        └── 81723
            └── ayy.js
      */
      const thisbundledir = await fsp.mkdir(
        path.join(
          bundledir,
          filename,
        ),
        { recursive: true },
      )
      
      /**
       *      
       * eg
      /tmp
        └── 81723
            └── ayy.js 
               └── bundle.js
       */
      const thisbundlepath = path.join(
        thisbundledir,
        'index.js',
      )
      // bundle file
      await bundle(
        jspath,
        thisbundlepath,
      )

      // remember that these named exports are in this bundle
      return {
        names: namedexpkeys,
        bundlepath: thisbundlepath,
      }
    }),
  )
 
  // zip them
  // filter out bundles that don't have named exports
  res = res
    .filter((r) => r && r.names && r.names.length) 

  console.log(res)

  const zipPaths = await Promise.all(
    res.map((r) => createZip(r)),
  )

  console.log(zipPaths)

  // zip them, deploy them to amazon
}

main('/home/qng/cloudkernel/recruiter/tm')

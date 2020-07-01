/* eslint-disable global-require, import/no-dynamic-require */

const path = require('path')
const fsp = require('fs').promises
const os = require('os')

const { bundle } = require('./bundle/index')
const { getJsFilePaths } = require('./discover/index')
const { getNamedExports } = require('./discover/index')

async function main(root) {
  // paths to relevant js files
  const jspaths = await getJsFilePaths(root)

  // make a place for all our bundles
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

      const bundlepath = path.join(
        bundledir,
        `${filename}-bundle.js`,
      )
      // bundle file
      await bundle(
        jspath,
        bundlepath,
      )

      // remember that these named exports are in this bundle
      return {
        names: namedexpkeys,
        bundlepath: bundlepath,
      }
    }),
  )
  
  // deploy them
  res = res
    .filter((r) => r && r.names != null) // filter out bundles that don't have named exports

  // zip them, deploy them to amazon
}

main('/home/qng/cloudkernel/recruiter/tm')

/* eslint-disable global-require, import/no-dynamic-require */

const { bundle } = require('./bundler/index')
const { getJsFilePaths, getNamedExports } = require('./discoverer/index')
const { deployAmazon } = require('./deployer/amazon/index')
const { transpile } = require('./transpiler/index')
const { zip } = require('./zipper/index')

const LANG = 'js'
const PROVIDER = 'amazon'

// TODO refac out 'js', make argument for main

async function main(root) {
  // paths to relevant js files
  let jspaths = await getJsFilePaths(root)
  // get each .js's file named export
  let namedexpkeys = jspaths.map((jspath) => getNamedExports(jspath))

  // filter out files with no named exports
  jspaths = jspaths.filter((p, idx) => namedexpkeys[idx] && namedexpkeys[idx].length > 0)
  namedexpkeys = namedexpkeys.filter((k) => k && k.length > 0)

  // bundle each file
  const bundleCodes = await Promise.all(
    jspaths.map((jspath) => bundle(jspath, LANG, PROVIDER)),
  )

  // for each named export, transpile file, zip it, and upload it
  // [ {namedexp: string, zippath: string }, ... ]
  let zippedInfos = await Promise.all(
    // for each file in parallel
    namedexpkeys.map(async (ks, idx) => {
      const done = []
      // for a file, for each named export in parallel
      await Promise.all(
        ks.map(async (k) => {
          // transpile it
          const transpiled = transpile(bundleCodes[idx], k, LANG, PROVIDER)
          // zip it 
          const zippath = await zip(transpiled)
          done.push({
            namedexp: k,
            zippath: zippath,
          })
        }),
      )
      return done
    }),
  )

  // flatten it, we don't need info grouped per-file
  zippedInfos = zippedInfos.reduce((acc, curr) => [...acc, ...curr], [])

  // deplopy each zip
  await Promise.all(
    zippedInfos.map((zinfo) => {
      const fnname = `${zinfo.namedexp}-fn` // Lambda name
      return deployAmazon(zinfo.zippath, fnname)
    }),
  )

  console.log('deployed all fns')
}

module.exports = {
  main,
}

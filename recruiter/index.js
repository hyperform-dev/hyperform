/* eslint-disable global-require, import/no-dynamic-require */

const { bundle } = require('./bundler/index')
const { getFilePaths, getNamedExports } = require('./discoverer/index')
const { deployAmazon } = require('./deployer/amazon/index')
const { transpile } = require('./transpiler/index')
const { zip } = require('./zipper/index')

const LANG = 'js'
const PROVIDER = 'amazon'

// TODO refac out 'js', make argument for main

/**
 * 
 * @param {string} root 
 * @param {string} lang js|
 * @param {string[]} whitelist List of function names to deploy. If not specified, will deploy all function it finds in root
 */
async function main(root, lang, whitelist) {
  // paths to relevant js files
  let jspaths = await getFilePaths(root, lang)
  // get each .js's file named export
  let namedexpkeys = jspaths.map((jspath) => getNamedExports(jspath))

  // filter out files with no named exports
  jspaths = jspaths.filter((p, idx) => namedexpkeys[idx] && namedexpkeys[idx].length > 0)
  namedexpkeys = namedexpkeys.filter((k) => k && k.length > 0)

  // if whitelist provided, filter out named exports that aren't on there
  if (whitelist && whitelist.length > 0) {
    console.log(`USING whitelist ${JSON.stringify(whitelist)}`)
    namedexpkeys = namedexpkeys
      .map((ks) => ks.filter((k) => whitelist.includes(k)))
    // skip files that now have no asked-for named exports
    jspaths = jspaths.filter((p, idx) => namedexpkeys[idx] && namedexpkeys[idx].length > 0)
  }

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
      const fnname = `${zinfo.namedexp}` // Lambda name (use exact same value so ck can call them)
      return deployAmazon(zinfo.zippath, fnname)
    }),
  )

  console.log('deployed all fns')
}

module.exports = {
  recruiter: main,
}

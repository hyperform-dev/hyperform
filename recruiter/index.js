/* eslint-disable global-require, import/no-dynamic-require */

const { bundle } = require('./bundler/index')
const { getFilePaths, getNamedExports } = require('./discoverer/index')
const { deployAmazon } = require('./deployer/amazon/index')
const { zip } = require('./zipper/index')

// in lambda : export normally, but wrap in context.succeed (idempotent)
// in local: export normally
// in local --cloud: export als envoy

const appendix = `

;module.exports = (() => {
  function envoy(name, input) {
    console.log("Would envoy " + name + " input " + input)
  }

  // for lambda, wrap all exports in context.succeed
  function wrapExports(moduleexports) {
    const newmoduleexports = { ...moduleexports };
    const expkeys = Object.keys(moduleexports)

    for (let i = 0; i < expkeys.length; i += 1) {
      const expkey = expkeys[i]
      const userfunc = newmoduleexports[expkey]
      const wrappedfunc = async function handler(event, context) {
        const res = await userfunc(event, context) // todo add context.fail
        context.succeed(res)
      }
      newmoduleexports[expkey] = wrappedfunc
    }

    return newmoduleexports
  }

  // for --cloud
  function convExports(moduleexports) {
    const newmoduleexports = { ...moduleexports };
    const fn_expkeys = Object.keys(moduleexports).filter((k) => (/fn_/.test(k) === true))

    // for each fn_ export
    for (let i = 0; i < fn_expkeys.length; i += 1) {
      // replace it with envoy version
      const fn_expkey = fn_expkeys[i]
      console.log('changing ', fn_expkey)
      newmoduleexports[fn_expkey] = (...args) => envoy(fn_expkey, ...args)
    }

    return newmoduleexports;
  }

  const curr = { ...module.exports }

  const isExportingFns = Object.keys(curr).some((k) => (/fn_/.test(k) === true))
  const isInLambda = !!(process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV)
  const isCloudFlagTrue = (process.argv.includes('--cloud') === true)

  const shouldWrapExports = isInLambda
  const shouldConvExports = (isCloudFlagTrue && isExportingFns)

  console.log('need to conv exports: ', shouldConvExports)
  console.log('need to wrap exports: ', shouldWrapExports)

  // --cloud : conv
  if (shouldConvExports === true) {
    const newmoduleexp = convExports(curr)
    return newmoduleexp
  }
  // in Lambda : wrap
  if (shouldWrapExports === true) {
    const newmoduleexp = wrapExports(curr)
    return newmoduleexp
  }

  return curr; // Export unchanged (fallback, no flag)
})();

`

async function main(dir, fnregex) {
  // [ { p: /home/file.js, exps: ['fn_1', 'fn_2'] }, ... ]
  const infos = (await getFilePaths(dir, 'js'))
    .map((p) => ({ 
      p: p,
      exps: getNamedExports(p),
    }))
    // skip files that don't have named exports
    .filter(({ exps }) => exps != null && exps.length > 0) 
    // skip files that don't have named exports that fit fnregex
    .filter(({ exps }) => exps.some((exp) => fnregex.test(exp) === true))
    // filter out exports that don't fit fnregex
    .map((el) => ({ ...el, exps: el.exps.filter((exp) => fnregex.test(exp) === true) }))

  /*
        [
          {
            p: '/home/qng/cloudkernel/recruiter/lambs/hmm.js',
            exps: [ 'fn_' ]
          }
        ]
    */
  // read, transpile, bundle, deploy each p as exps
  await infos.map(async (info) => {
    // bundle file
    let bundledCode = await bundle(info.p)
    
    // add module append
    bundledCode += appendix
    
    // zip it
    const zipPath = await zip(bundledCode)

    // for every named fn_ export, deploy the zip 
    // with correct handler
    await Promise.all(
      info.exps.map(async (exp) => { // under same name
        const handler = `index.${exp}`
        console.log(`Deploying ${zipPath} as ${exp} with handler ${handler}`)
        await deployAmazon(zipPath, exp, handler)
      }),
    )
  })
}

// /**
//  * 
//  * @param {string} root 
//  * @param {string} lang js|
//  * @param {Regex} fnregex Tests named exports
//  */
// async function main(root, lang, fnregex) {
//   // top level error boundary
//   try {
//     // paths to relevant js files
//     let jspaths = await getFilePaths(root, lang)
//     // get each .js's file named export
//     let namedexpkeys = jspaths.map((jspath) => getNamedExports(jspath))
  
//     // filter out files with no named exports
//     jspaths = jspaths.filter((p, idx) => namedexpkeys[idx] && namedexpkeys[idx].length > 0)
//     namedexpkeys = namedexpkeys.filter((ks) => ks && ks.length > 0)
  
//     // if whitelist provided, filter out named exports that aren't on there
//     if (fnregex != null) {
//       namedexpkeys = namedexpkeys
//         .map((ks) => ks.filter((k) => fnregex.test(k) === true))
//       // skip files that now have no asked-for named exports
//       jspaths = jspaths.filter((p, idx) => namedexpkeys[idx] && namedexpkeys[idx].length > 0)
//     }
  
//     // bundle each file
//     spinnies.add('bundling', { text: 'Bundling...' })
//     const bundleCodes = await Promise.all(
//       jspaths.map((jspath) => bundle(jspath, LANG, PROVIDER)),
//     )
//     spinnies.remove('bundling')
  
//     // for each named export, transpile file, zip it, and upload it
//     // [ {namedexp: string, zippath: string }, ... ]
//     spinnies.add('zipping', { text: 'Zipping...' })
//     let zippedInfos = await Promise.all(
//       // for each file in parallel
//       namedexpkeys.map(async (ks, idx) => {
//         const done = []
//         // for a file, for each named export in parallel
//         await Promise.all(
//           ks.map(async (k) => {
//             // transpile it
//             const transpiled = transpile(bundleCodes[idx], k, LANG, PROVIDER)
//             // zip it 
//             const zippath = await zip(transpiled)
//             done.push({
//               namedexp: k,
//               zippath: zippath,
//             })
//           }),
//         )
//         return done
//       }),
//     )
//     spinnies.remove('zipping')
  
//     // flatten it, we don't need info grouped per-file
//     zippedInfos = zippedInfos.reduce((acc, curr) => [...acc, ...curr], [])
  
//     // deplopy each zip
//     spinnies.add('deploying', { text: 'Deploying...' })
//     await Promise.all(
//       zippedInfos.map((zinfo) => {
//         const fnname = `${zinfo.namedexp}` // Lambda name (use exact same value so ck can call them)
//         return deployAmazon(zinfo.zippath, fnname)
//       }),
//     )
//     spinnies.remove('deploying')
//     spinnies.stopAll()
//   } catch (e) {
//     spinnies.stopAll()
//     throw e
//   }
// }

// module.exports = {
//   recruiter: main,
// }

main('/home/qng/cloudkernel/recruiter', /^fn_/)

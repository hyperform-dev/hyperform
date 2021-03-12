/* eslint-disable arrow-body-style */
const path = require('path')

/**
 * Appends code to an index.js ("code") in "dir" that imports 
 * and immediately exports given exports.  Has no side effects.
 * Needed for Google that only looks into index.js
 * @param {string} code
 * @param {string} dir
 * @param {[ {p: string, exps: string[] }]}  infos For instance  [
      {
        p: '/home/qng/dir/somefile.js',
        exps: [ 'endpoint_hello' ]
      }
    ]
 * */
function kindle(code, dir, infos) {
  const kindleAppendix = `
  ;module.exports = {
    ${
  // for each file
  infos.map(({ p, exps }) => {
    // for each endpoint export
    return exps.map((exp) => {
      const relPath = path.relative(dir, p)
      // it's exported from index.js, whose source code this will be (ie above)
      if (relPath === 'index.js') {
        return `${exp}: module.exports.${exp} || exports.${exp},`
      } else {
      // it's exported from other file
        return `${exp}: require('./${relPath}').${exp},`
      }
    })
      .join('\n')
  })
    .join('\n')
}
  };
  `

  const kindledCode = `
${code}
${kindleAppendix}
`
  return kindledCode
}

module.exports = {
  kindle,
}

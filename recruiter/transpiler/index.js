const transpilers = {
  js: {
    amazon: function (code, expkey) {
      return (
        `
          ${code}

          let userfunc = module.exports.${expkey}
          // Amazon enters here
          exports.handler = async (event, context) => {
            let res 
            try {
              res = await userfunc(event, context)
              context.succeed(res) // if user didn't call context.succeed() himself
            } catch(e) {
              context.fail(e)
            }
          }
          // set both to be sure
          module.exports.handler = exports.handler 
        `
      )
    },
  },
}

/**
 * @returns {string} transpiled code
 * @param {string} code 
 * @param {string} expkey Which named export provider should use as entry point
 * @param {string} lang js|
 * @param {string} provider amazon|
 */
function transpile(code, expkey, lang, provider) {
  if (lang !== 'js') {
    throw new Error(`UNIMPLEMENTED: transpile lang ${lang}`)
  }
  if (provider !== 'amazon') {
    throw new Error(`UNIMPLEMENTED: transpile provider ${provider}`)
  }

  return transpilers[lang][provider](code, expkey)
}

module.exports = {
  transpile,
}

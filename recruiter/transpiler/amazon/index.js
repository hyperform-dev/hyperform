/**
 * @param {string} code Code of a js file
 * @param {string} namedExportKey The (one) named export that should be exposed to Amazon
 *  @returns {string} The code, with an amazonian entry point
 */
function transpileToAmazon(code, namedExportKey) {
  // append amazon entry point to code
  const newcode = `
    ${code}

    let userfunc = module.exports.${namedExportKey}
    // Amazon enters here
    exports.handler = async (event, context) => {
      try {
        const res = await userfunc(event)
        context.succeed(res)
      } catch(e) {
        context.fail(e)
      }
    }
    // set both to be sure
    module.exports.handler = exports.handler 
  `

  return newcode
}

module.exports = {
  transpileToAmazon,
}

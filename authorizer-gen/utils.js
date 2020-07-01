// const uuidv4 = require('uuid').v4

// /**
//  * @description Generates a '''random''' bearer token TODO 
//  * @returns {string} '''Random''' bearer token
//  */
// function generateRandomBearerToken() {
//   const token = uuidv4()
//     .replace(/-/g, '')
//   return token
// }

// /**
//  * @returns {void}
//  * @throws if "bearerToken" does not fix requirements
//  */
// function ensureBearerTokenSecure(bearerToken) {
//   // messages mostly for us
//   if (typeof bearerToken !== 'string') throw new Error(`Bearer token must be a string but is ${typeof bearerToken}`)
//   if (bearerToken.trim().length < 10) throw new Error('Bearer token, trimmed, must be equal longer than 10')
//   if (/^[a-zA-Z0-9]+$/.test(bearerToken) === false) throw new Error('Bearer token must fit regex /^[a-zA-Z0-9]+$/ (alphanumeric)')
// }

// module.exports = {
//   generateRandomBearerToken,
//   ensureBearerTokenSecure,
// }

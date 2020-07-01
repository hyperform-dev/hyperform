const uuidv4 = require('uuid').v4

/**
 * @description Generates a '''random''' bearer token TODO 
 * @returns {string} '''Random''' bearer token
 */
function generateRandomBearerToken() {
  const token = uuidv4()
    .replace(/-/g, '')
  return token
}

module.exports = {
  generateRandomBearerToken,
}

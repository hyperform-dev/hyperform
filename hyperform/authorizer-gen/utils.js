const uuidv4 = require('uuid').v4

function generateRandomBearerToken() {
  const token = uuidv4()
    .replace(/-/g, '')
  return token
}

module.exports = {
  generateRandomBearerToken,
}

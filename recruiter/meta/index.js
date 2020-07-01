/**
 * Detects whether jest is running this code
 */
function isInTesting() {
  if (process.env.JEST_WORKER_ID != null) {
    return true 
  }
  if (process.env.NODE_ENV === 'test') {
    return true
  } 
  return false 
}

module.exports = {
  isInTesting,
}

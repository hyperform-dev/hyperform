exports.handler = async(event) => {
  
  const expected = 'Bearer abcde'
  const isAuthorized = event.headers.authorization === expected
  return {
    isAuthorized
  }

};
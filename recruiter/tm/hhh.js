function myincreturn(event) {
  return {
    num: event.num + 1,
  }
}

function myincsucceed(event, context) {
  context.succeed({
    num: event.num + 1,
  })
}

module.exports = {
  myincreturn,
  myincsucceed,
}

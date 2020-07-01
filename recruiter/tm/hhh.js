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

function myreturnarray() {
  return [89, 99, 100, 1092838471, 192]
}
module.exports = {
  myincreturn,
  myincsucceed,
  myreturnarray,
}

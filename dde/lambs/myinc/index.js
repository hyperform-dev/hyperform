exports.handler = (event, context) => {
  context.succeed({
    num: event.num + 1,
  })
}

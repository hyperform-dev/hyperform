exports.handler = (event, context) => {
  console.log('consolelogging from lambda')
  context.succeed({
    a: 1,
  })
}

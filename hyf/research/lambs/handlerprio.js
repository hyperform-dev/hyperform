exports.handler = () => console.log("exports handler")

module.exports.handler = () => console.log("undresived module exports handler")

module.exports = (() => ({
  handler: () => console.log("intercepted module exports handler")
}))()
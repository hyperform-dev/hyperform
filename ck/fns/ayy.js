function myinc(event) {
  return {
    num: event.num + 1,
  }
}

const { Cloudkernel } = require('./ck-bundle')

async function myck(event) {
  const flow = [
    { run: 'myinc' },
  ]
  const clk = new Cloudkernel(flow)
  const input = { num: 68 }
  const res = await clk.run(input)
  console.log(`clk in-lambda computed: ${JSON.stringify(res)}`)
  return res
}

module.exports = {
  myinc,
  myck,
}

const Spinnies = require('spinnies')
const { isInTesting } = require('../meta/index')

const spinner = {
  interval: 80,
  frames: [
    '⠁',
    '⠂',
    '⠄',
    '⡀',
    '⢀',
    '⠠',
    '⠐',
    '⠈',
  ],
}

const spinnies = new Spinnies({ color: 'white', succeedColor: 'white', spinner: spinner });

const { log } = console
let logdev 

// Don't show dev-level logging
// (Comment out to show dev-level logging)
logdev = () => { }
// Don't show timings
// (Comment out to see timings)
console.time = () => { }
console.timeEnd = () => { }

// In testing, be silent but console.log successes and fails
if (isInTesting() === true) {
  spinnies.add = () => { }
  spinnies.update = () => { }
  spinnies.remove = () => { }
  spinnies.succeed = (_, { text }) => console.log(text)
  spinnies.fail = (_, { text }) => console.log(text)
  spinnies.updateSpinnerState = () => {}
}

spinnies.f = spinnies.fail 
spinnies.succ = spinnies.succeed 

module.exports = {
  spinnies,
  log,
  logdev,
}

const Spinnies = require('spinnies')
const { isInTesting } = require('../meta/index')

const spinner = {
  interval: 80,
  frames: [
    '⠄',
    '⠆',
    '⠇',
    '⠋',
    '⠙',
    '⠸',
    '⠰',
    '⠠',
    '⠰',
    '⠸',
    '⠙',
    '⠋',
    '⠇',
    '⠆',
  ],
}

const spinnies = new Spinnies({ color: 'white', succeedColor: 'white', spinner: spinner });

const { log } = console
let logdev 
// set right logging level
// don't show dev-level logging
// Comment this out to see logdev
logdev = () => { }
// don't show timings
// Comment this out to see timings
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

module.exports = {
  spinnies,
  log,
  logdev,
}

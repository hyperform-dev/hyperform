const Spinnies = require('spinnies')
const { isInTesting } = require('../meta/index')

const spinner = {
  interval: 80,
  frames: [
    '⠋',
    '⠙',
    '⠹',
    '⠸',
    '⠼',
    '⠴',
    '⠦',
    '⠧',
    '⠇',
    '⠏',
  ],
}

const spinnies = new Spinnies({ color: 'white', succeedColor: 'white', spinner: spinner });

// In testing, be silent
if (isInTesting() === true) {
  spinnies.justPrintSuccess = () => {}
  spinnies.justPrintFail = () => {}
  spinnies.add = () => {}
  spinnies.update = () => {}
  spinnies.updateSpinnerState = () => {}
}

module.exports = {
  spinnies,
}

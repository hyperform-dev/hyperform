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

// In testing, be silent
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
}

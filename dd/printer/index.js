const Spinnies = require('spinnies')

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

module.exports = {
  spinnies,
}

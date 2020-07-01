const path = require('path')

module.exports = {
  mode: 'production',
  entry: './research/hmm.js',
  target: 'node',
  output: {
    path: path.join(__dirname, 'research'),
    filename: 'bundle.js',
    libraryTarget: 'commonjs',
  },
  // already provided in lambda
}

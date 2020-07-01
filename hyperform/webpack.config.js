const path = require('path')

module.exports = {
  mode: 'production',
  entry: './lambs/imp.js',
  target: 'node',
  output: {
    path: '/tmp',
    filename: 'irrelevant-bundle.js',
    libraryTarget: 'commonjs',
  },
  externals: {
    'aws-sdk': 'aws-sdk',
  },
}

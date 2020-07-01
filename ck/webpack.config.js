const path = require('path')

module.exports = {
  mode: 'production',
  entry: './index.js',
  target: 'node',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'ck-bundle.js',
    libraryTarget: 'commonjs',
  },
  // aws-sdk is already provided in lambda
  externals: {
    'aws-sdk': 'aws-sdk',
  },
}

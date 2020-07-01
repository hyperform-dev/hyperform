const path = require('path')

module.exports = {
  mode: 'production',
  entry: './index.js',
  target: 'node',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'hf-bundle.js',
    libraryTarget: 'commonjs',
  },
  // already provided in lambda
  externals: {
    'aws-sdk': 'aws-sdk',
  },
}

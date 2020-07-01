module.exports = {
  mode: 'production',
  entry: './index.js',
  target: 'node',
  output: {
    path: '/tmp',
    filename: 'bundle.js',
    libraryTarget: 'commonjs',
  },
  // aws-sdk is already provided in lambda
  externals: {
    'aws-sdk': 'aws-sdk',
  },
}

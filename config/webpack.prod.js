const path = require('path');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { merge } = require('webpack-merge');

const commonConfig = require('./webpack.common');

module.exports = merge(commonConfig, {
  mode: 'production',
  context: path.resolve(__dirname, '../src'),
  entry: {
    'quill-table-better.js': './quill-table-better.ts',
    'quill-table-better': './assets/css/quill-table-better.scss'
  },
  output:{
    filename: '[name]',
    library: 'QuillTableBetter',
    libraryExport: 'default',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, '../dist'),
    clean: true
  },
  externals: {
    'quill': {
      commonjs: 'quill',
      commonjs2: 'quill',
      amd: 'quill',
      root: 'Quill'
    }
  },
  optimization: {
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin({
        parallel: 4
      })
    ]
  }
});
const path = require('path');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { merge } = require('webpack-merge');

const commonConfig = require('./webpack.common');

module.exports = merge(commonConfig, {
  mode: 'production',
  entry: path.resolve(__dirname, '../src/quill-table-better.ts'),
  output:{
    filename: 'quill-table-better.js',
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
    ],
    splitChunks: {
      // include all types of chunks
      chunks: 'all'
    }
  }
});
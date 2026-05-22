const path = require('path');
const { merge } = require('webpack-merge');

const commonConfig = require('./webpack.common.cjs');

// UMD build for traditional compatibility
const umdConfig = merge(commonConfig, {
  mode: 'production',
  context: path.resolve(__dirname, '../src'),
  entry: {
    'quill-table-better.js': './quill-table-better.ts',
    'quill-table-better': './assets/css/quill-table-better.scss'
  },
  output:{
    filename: '[name]',
    library: {
      name: 'QuillTableBetter',
      type: 'umd',
      export: 'default'
    },
    path: path.resolve(__dirname, '../dist'),
    clean: false, // Don't clean since we're building multiple configs
    environment: {
      arrowFunction: true,
      bigIntLiteral: false,
      const: true,
      destructuring: true,
      dynamicImport: false,
      forOf: true,
      module: false
    }
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
    moduleIds: 'deterministic'
  },
  target: 'web'
});

// ESM build for module federation compatibility (no dynamic requires)
const esmConfig = merge(commonConfig, {
  mode: 'production',
  context: path.resolve(__dirname, '../src'),
  entry: {
    'quill-table-better.mjs': './quill-table-better.ts'
  },
  output:{
    filename: '[name]',
    module: true,
    path: path.resolve(__dirname, '../dist'),
    library: {
      type: 'module'
    },
    environment: {
      module: true
    },
    clean: false // Already cleaned by first config
  },
  experiments: {
    outputModule: true
  },
  externals: {
    'quill': 'quill'
  },
  optimization: {
    minimize: true,
    moduleIds: 'deterministic'
  },
  target: 'web',
  plugins: commonConfig.plugins // Keep CSS extraction for CSS file if needed
});

// Export both configurations
module.exports = [umdConfig, esmConfig];

const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader'
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader'
      },
      {
        test: /\.png/,
        type: 'asset/inline'
      },
      {
        test: /\.(html|svg)$/i,
        loader: 'html-loader'
      }
    ]
  },
  plugins: [new MiniCssExtractPlugin({
    filename: '[name].css'
  })],
  resolve: {
    extensions: ['.ts', '.scss', '.js']
  }
};

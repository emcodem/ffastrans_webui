const path = require('path');
const fs = require('fs');

const rootNodeModules = path.resolve(__dirname, '../../../node_modules');

// Debug: verify paths
console.log('Root node_modules path:', rootNodeModules);
console.log('ts-loader exists:', fs.existsSync(path.join(rootNodeModules, 'ts-loader')));
console.log('webpack exists:', fs.existsSync(path.join(rootNodeModules, 'webpack')));
console.log('Available modules:', fs.readdirSync(rootNodeModules).slice(0, 10));

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, './init.ts'),
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      dhtmlx: path.resolve(__dirname, '../../dependencies/dhtmlx/9.2.4/suite.js'),
    },
    modules: [rootNodeModules, 'node_modules'],
  },
  resolveLoader: {
    modules: [rootNodeModules, 'node_modules'],
  },
  externals: {
    dhtmlx: 'dhx',
  },
  devtool: 'source-map',
  context: __dirname,
};

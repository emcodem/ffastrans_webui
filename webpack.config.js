const path = require('path');

module.exports = {
	target: 'node',
  entry: './server.js',
  externalsPresets: { node: true },
  mode: 'development',
  devtool: 'source-map',
  module: {
    rules: [
	  {
        test: /\.html$/i,
        loader: "html-loader",
      },
	  {
        resourceQuery: /raw/,
        type: "asset/source",
      },
      {
        test: /\.css$/i,
        use: ["css-loader"],
      },
     
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[hash].[ext]',
              outputPath: 'assets/',  // Store static files in dist/assets/
              publicPath: '/assets/'  // Reference these files from /assets/ in the browser
            }
          },
		 

        ]
      }
    ]
  },
  plugins: [
   
	],
  output: {
	  globalObject: 'this',					//workaround  self is not defined after running webpack biuld
    filename: 'bundle.js',                  // Bundled JS file
    path: path.resolve(__dirname, 'dist'),   // Output directory
    publicPath: '/'                          // Ensures all assets are resolved from the root path
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 9000
  }
};

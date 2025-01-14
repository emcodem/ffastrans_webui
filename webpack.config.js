const path = require('path');

module.exports = {
	target: 'node',
	entry: './server.js',
	externalsPresets: { node: true },
	mode: 'production',
	devtool: 'source-map',
	module: {
		rules: [
		 //no need for rules as we bundle using nexe
		]
	},
	plugins: [

	],
		output: {
		globalObject: 'this',					//workaround  self is not defined after running webpack biuld
		filename: 'bundle.js',                  // Bundled JS file
		path: path.resolve(__dirname, 'dist'),   // Output directory
		publicPath: '/'                          // Ensures all assets are resolved from the root path
	}
};

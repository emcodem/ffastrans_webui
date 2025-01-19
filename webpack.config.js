const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
//'yaml-loader' module is required by rules 

module.exports = {
	target: 'node',
	entry: {
			server: {import:'./server.js',filename:'server.js'},
			rest_service: {import:'./rest_service/app.js',filename:'rest_service/app.js'}
	},
	externalsPresets: { node: true },
	mode: 'production',
	devtool: 'source-map',
	module: {
		rules: [
		 //no need for rules as we bundle using nexe
		       {
				test: /\.yaml$/, // Match YAML files
				use: 'yaml-loader' // Use yaml-loader to process them
			  }
		]
	},
	plugins: [
		/*swagger-ui needs some static files, if we used the typescript module this would not be the case but as long as we use cjs, we need to copy the files into root of rest_service */
		new CopyWebpackPlugin({
			patterns: [
				{from: './rest_service/node_modules/swagger-ui-dist/swagger-ui.css', to: "rest_service", toType:"dir"},
				{from:'./rest_service/node_modules/swagger-ui-dist/swagger-ui-bundle.js',to: "rest_service", toType:"dir"},
				{from:'./rest_service/node_modules/swagger-ui-dist/swagger-ui-standalone-preset.js',to: "rest_service", toType:"dir"},
				{from:'./rest_service/node_modules/swagger-ui-dist/favicon-16x16.png',to: "rest_service", toType:"dir"},
				{from:'./rest_service/node_modules/swagger-ui-dist/favicon-32x32.png',to: "rest_service", toType:"dir"},
				
				{ from: './webinterface', to: 'webinterface', toType:"dir" }
			]
		})
	],
	output: {
		globalObject: 'this',					//workaround  self is not defined after running webpack biuld
		
		chunkFilename: 'chunks/[name].[chunkhash].js',
		assetModuleFilename: 'media/[name][hash][ext][query]',
		path: path.resolve(__dirname, 'dist'),   // Output directory
		publicPath: '/'                          // Ensures all assets are resolved from the root path
	}
}

/* webpack config file, use:  cd C:\dev\ffastrans_webui\webinterface\typescript_client\clientdist && npx webpack --config ../prod.config.js --mode=production */
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'css-loader'
        ]
      }
    ]
  }
}
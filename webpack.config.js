/* webpack config file, use:  cd C:\dev\ffastrans_webui\webinterface\typescript_client\clientdist && npx webpack --config ../prod.config.js --mode=production */
module.exports = {
    entry: './server.js',
    externalsPresets: { node: true },
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
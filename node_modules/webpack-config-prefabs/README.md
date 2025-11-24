# webpack-config-prefabs

Using webpack shouldn't require fiddling with configuration flags for every project.  This
library exposes factory functions that create sensible, default webpack configurations
for different situations.

They have a few built-in options to tweak the configuration.  If
you have more advanced needs, you can modify the returned configuration.
It is, after all, just an object.

## Example

To bundle a node module or CLI tool, perhaps to reduce download size or increase startup speed,
write a `webpack.config.js` that looks like this:

```javascript
const {nodeLibrary} = require('webpack-config-prefabs');
module.exports = nodeLibrary(module, {
    entry: './src/index.js',
    outputFilepath: './dist/index.js',
});
```

*`module` is passed so that we can discover the root directory of your project, which
allows us to generate more defaults automatically.*

## Experimental automatic configuration

If you want to avoid creating a `webpack.config.js`, add a package script that
tells webpack to use the bundled auto.js script.  Also add a
`"webpack-config-prefabs"` property specifying which prefab to use.

```
// in your package.json
"scripts": {
    "bundle": "webpack --config ./node_modules/webpack-config-prefabs/auto.js"
},
"webpack-config-prefabs": "nodeLibrary"
```

And run the script:

```
$ yarn bundle
```

`auto.js` will read your package.json and generate a default config from the
prefab.  You can't specify options, so you're forced to use the default.
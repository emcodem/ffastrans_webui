// `prefab=nodeLibrary webpack --config ./node_modules/webpack-config-prefabs/auto.js` to automatically generate a config.
// No need to create your own webpack.config.js

const findUp = require('find-up');
const api = require('./');

const envVar = 'prefab';
const packageJsonField = 'webpack-config-prefabs';
let prefabType = /** @type {keyof typeof factories} */(process.env[envVar]);
const packageJsonPath = findUp.sync('package.json');
const packageJson = require(packageJsonPath);
if(!prefabType) prefabType = packageJson[packageJsonField];

const factories = {
    nodeLibrary: api.nodeLibrary
};
const factory = api[prefabType];
if(!factory) {
    throw new Error(`Unexpected webpack prefab type specified by either "${ envVar }" environment variable or "${ packageJsonField }" field in package.json: "${ factory }".  Should be one of: ${ Object.keys(factories).join(', ') }`);
}

const config = factory({filename: packageJsonPath}, {});

module.exports = config;
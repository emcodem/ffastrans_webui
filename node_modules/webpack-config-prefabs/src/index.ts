import Path from 'path';
import fs from 'fs';
import {BannerPlugin, Configuration as WebpackConfiguration, RuleSetRule} from 'webpack';
import {fromPairs} from 'lodash';

/*
 * TODO implement preserveEntryPoints
 * Accepts a glob of src paths, a rootDir, and an outDir
 * For each matching source file:
 * a) ensure it is bundled
 * b) ensure a shim is emitted so that people can require('your-module/lib/foo/bar.js') and things will still "just work"
 */

/*
 * TODO
 * Preserve shebangs in the shims emitted by preserveEntryPoints
 */

/*
 * TODO analyzer integration; spit out a static analysis file
 */

/*
 * TODO node: false and new webpack.DefinePlugin({'__node__require': 'require'})
 * so that modules can easily use __dirname and make require() calls.
 */

/*
 * webpack-node-externals - automatically externalizes all node_modules
 * https://www.npmjs.com/package/webpack-node-externals
 */

/*
 * Add a function to `externals` array.
 * Allow externalizing single files by root-relative path.
 * For example: noBundle 
 * function(context, request, callback) {
      if (/^yourregex$/.test(request)){
        return callback(null, 'commonjs ' + request);
      }
      callback();
    }
 */
/*
 * Handle Windows paths correctly.
 */
/*
 * change noBundle to bundle
 */

interface FullNodeLibraryOptions extends Pick<WebpackConfiguration, 'entry'> {
    /** We only support a single string at the moment, not arrays, functions, or anything else allowed by webpack */
    entry: string;
    outputFilepath: string;
    /** Enable .ts, .tsx, and .jsx files */
    enableTypescript: boolean;
    /** Emit a sourcemap */
    sourceMap: boolean;
    /** Use source-map-loader to parse input sourcemaps */
    ingestSourceMaps: boolean;
    /** external modules to exclude from bundling */
    noBundle: Array<string>;
    /**
     * Set to false to disable minification and preserve readability of the
     * bundle.
     * Sets `optimization: {minimize: false}`
     */
    minimize: boolean;
}
const defaultOptions = {
    entry: './src/index.ts',
    outputFilepath: './dist/bundle.js',
    enableTypescript: true,
    sourceMap: true,
    noBundle: [],
    ingestSourceMaps: true,
    minimize: true
};
const _assertDefaultsHaveCorrectPropertyNames: keyof FullNodeLibraryOptions = null as any as keyof typeof defaultOptions;
type NodeLibraryOptions = {
    [K in Extract<keyof FullNodeLibraryOptions, keyof typeof defaultOptions>]?: FullNodeLibraryOptions[K];
} & {
    [K in Exclude<keyof FullNodeLibraryOptions, keyof typeof defaultOptions>]: FullNodeLibraryOptions[K];
};

/** We only need a few fields from the `module` object. */
type NodeJSModuleFields = {
    filename: string
};

/**
 * Sensible webpack configuration for bundling a node library into a single file.
 * 
 * Usage: module.exports = nodeLibrary(module, {/* override defaults here * /});
 * 
 * The first argument is your `module` object, which is a convenient way for us to
 * get your `__dirname` and perhaps other bits of metadata in the future.
 */
export function nodeLibrary(module: NodeJSModuleFields, options: NodeLibraryOptions) {
    const __dirname = Path.dirname(module.filename);
    const opts: FullNodeLibraryOptions = {
        ...defaultOptions,
        ...options
    };
    const {enableTypescript, entry, outputFilepath, sourceMap, noBundle, ingestSourceMaps, minimize} = opts;
    const entryAbs = Path.resolve(__dirname, entry);
    const outputFilepathAbs = Path.resolve(__dirname, outputFilepath);
    const outputDir = Path.dirname(outputFilepathAbs);
    const outputName = Path.basename(outputFilepathAbs);
    
    // Detect entry-point shebang
    const shebang = fs.readFileSync(entryAbs, 'utf8').split('\n')[0];
    const nodeRequireBoilerplate = 'var __node_require__ = require, __node_module__ = module;';
    const bannerPlugin = 
        shebang.slice(0, 2) === '#!'
        ? [new BannerPlugin({ banner: `${ shebang }\n${ nodeRequireBoilerplate }`, raw: true })]
        : [new BannerPlugin({ banner: nodeRequireBoilerplate, raw: true })];

    // TODO add __rootname
    // TODO copy from my npm-pwsh and strip-ts-types configs
    const config: WebpackConfiguration = {
        target: 'node',
        context: __dirname,
        entry,
        output: {
            path: outputDir,
            filename: outputName,
            libraryTarget: "commonjs2",
            // compute relative path from bundle dirname to entrypoint dirname.  That's the prefix.
            // special-case the webpack and internals stuff
            devtoolModuleFilenameTemplate: info => {
                if(Path.isAbsolute(info.absoluteResourcePath)) {
                    const relative = `${ Path.relative(outputDir, info.absoluteResourcePath) }`;
                    return relative[0] === '.' ? relative : `./${ relative }`;
                }
                return info.absoluteResourcePath;
                // return `webpack:///${info.resourcePath}?${info.loaders}`;
                // "../[resource-path]",
            }
        },
        mode: 'production',
        devtool: sourceMap ? 'source-map' : false,
        optimization: {
            minimize
        },
        externals: {
            // Example
            // vscode: "commonjs vscode"
            ...fromPairs(noBundle.map(v => [v, `commonjs ${ v }`]))
        },
        // Do not provide fake versions of process, __dirname, etc.
        node: false,
        resolve: {
            extensions: ['.js', '.json', ...(enableTypescript ? ['.ts', '.tsx', '.jsx'] : [])]
        },
        module: {
            rules: [
                ...enableTypescript ? [T<RuleSetRule>({
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: [{
                        loader: require.resolve('ts-loader'),
                        options: {
                            transpileOnly: true,
                            compilerOptions: {
                                module: 'esnext',
                                // Must be manually set to avoid transpileOnly errors,
                                // b/c TS compiler's transpileModule doesn't always
                                // disable them itself.
                                composite: undefined,
                                incremental: undefined,
                                declaration: undefined,
                                declarationMap: undefined
                            }
                        }
                    }]
                })] : [],
                // Replace all shebangs with an empty line
                // Can't use shebang-loader because it changes line numbers and
                // doesn't pass through sourcemaps
                {
                    test: /\.(?:tsx?|jsx?)$/,
                    loader: require.resolve('string-replace-loader'),
                    options: {
                        search: '^#![^\n]*?\n',
                        replace: '\n',
                        flags: ''
                    }
                },
                ...ingestSourceMaps ? [T<RuleSetRule>({
                    test: /\.(js|ts|tsx|jsx)$/,
                    use: [require.resolve("source-map-loader")],
                    enforce: "pre"
                })] : []
            ]
        },
        plugins: [...bannerPlugin]
    };

    return config;
}

function T<T>(a: T): T { return a }

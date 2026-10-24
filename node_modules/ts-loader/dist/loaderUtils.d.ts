import * as webpack from 'webpack';
import type { LoaderOptions } from './interfaces';
export declare const isWebpack5: boolean;
export declare function getOptions(loaderContext: webpack.LoaderContext<LoaderOptions>): LoaderOptions;
/**
 * webpack 4 and webpack 5 have different APIs for adding errors to modules. This function abstracts that away.
 */
export declare function addErrorToModule(module: webpack.Module, error: webpack.WebpackError): void;
//# sourceMappingURL=loaderUtils.d.ts.map
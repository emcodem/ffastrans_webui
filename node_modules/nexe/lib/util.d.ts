/// <reference types="node" />
import { readFile, writeFile, stat } from 'fs';
import { execFile } from 'child_process';
declare const rimrafAsync: (arg1: string) => Promise<void>;
export declare const STDIN_FLAG = "[stdin]";
export declare function each<T>(list: T[] | Promise<T[]>, action: (item: T, index: number, list: T[]) => Promise<any>): Promise<any[]>;
export declare function wrap(code: string): string;
declare function padRight(str: string, l: number): string;
declare const bound: MethodDecorator;
declare function dequote(input: string): string;
export interface ReadFileAsync {
    (path: string): Promise<Buffer>;
    (path: string, encoding: string): Promise<string>;
}
declare const readFileAsync: typeof readFile.__promisify__;
declare const writeFileAsync: typeof writeFile.__promisify__;
declare const statAsync: typeof stat.__promisify__;
declare const execFileAsync: typeof execFile.__promisify__;
declare const isWindows: boolean;
declare function pathExistsAsync(path: string): Promise<boolean>;
declare function isDirectoryAsync(path: string): Promise<boolean>;
/**
 * @param version See if this version is greather than the second one
 * @param operand Version to compare against
 */
declare function semverGt(version: string, operand: string): boolean;
export { dequote, padRight, semverGt, bound, isWindows, rimrafAsync, statAsync, execFileAsync, readFileAsync, pathExistsAsync, isDirectoryAsync, writeFileAsync, };

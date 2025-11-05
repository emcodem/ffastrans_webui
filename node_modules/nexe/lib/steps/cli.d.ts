import { NexeCompiler } from '../compiler';
/**
 * The "cli" step detects the appropriate input. If no input options are passed,
 * the package.json#main file is used.
 * After all the build steps have run, the output (the executable) is written to a file or piped to stdout.
 *
 * Configuration:
 *
 * @param {*} compiler
 * @param {*} next
 */
export default function cli(compiler: NexeCompiler, next: () => Promise<void>): Promise<unknown>;

/// <reference types="node" />
import { Readable } from 'stream';
import { File } from 'resolve-dependencies';
export declare type MultiStreams = (Readable | (() => Readable))[];
export declare function toStream(content: Buffer | string): Readable;
export declare class Bundle {
    size: number;
    cwd: string;
    rendered: boolean;
    private offset;
    private index;
    private files;
    streams: MultiStreams;
    constructor({ cwd }?: {
        cwd: string;
    });
    get list(): string[];
    addResource(absoluteFileName: string, content?: File | Buffer | string): Promise<number>;
    /**
     * De-dupe files by absolute path, partition by symlink/real
     * Iterate over real, add entries
     * Iterate over symlinks, add symlinks
     */
    renderIndex(): {
        [key: string]: [number, number];
    };
    /**
     * Add a stream if needed and an entry with the required offset and size
     * Ensure the calling order of this method is idempotent (eg, while iterating a sorted set)
     * @param entryPath
     * @param file
     * @param useEntry
     */
    addEntry(entryPath: string, file: File, useEntry?: string): void;
    toStream(): any;
}

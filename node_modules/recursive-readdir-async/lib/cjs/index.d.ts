/**
 * @packageDocumentation
 * project: recursive-readdir-async
 * @author: m0rtadelo (ricard.figuls)
 * @license MIT
 * 2018
 */
/// <reference types="node" />
/**
 * A fs.Stats object provides information about a file.
 * @external fs.Stats
 * @see https://nodejs.org/api/fs.html#fs_classfs_stats
 */
/**
 *  Options/Settings options available for this module
 *  @typedef Options
 *  @type {object}
 *  @property [mode] - The list will return an array of items. The tree will return the
 *  items structured like the file system. Default: LIST
 *  @property [recursive] - If true, files and folders of folders and subfolders will be listed.
 *  If false, only the files and folders of the select directory will be listed. Default: true
 *  @property [stats] - If true a stats object (with file information) will be added to every item.
 *  If false this info is not added. Default: false.
 *  @property [ignoreFolders] - If true and mode is LIST, the list will be returned with files only.
 *  If true and mode is TREE, the directory structures without files will be deleted.
 *  If false, all empty and non empty directories will be listed. Default: true
 *  @property [extensions] - If true, lowercase extensions will be added to every item in the extension object property
 *  (file.TXT => info.extension = ".txt"). Default: false
 *  @property [deep] - If true, folder depth information will be added to every item starting with 0 (initial path),
 *  and will be incremented by 1 in every subfolder. Default: false
 *  @property [realPath] - Computes the canonical pathname by resolving ., .. and symbolic links. Default: true
 *  @property [normalizePath] - Normalizes windows style paths by replacing double backslahes with single forward
 *  slahes (unix style). Default: true
 *  @property [include] - Positive filter the items: only items which DO (partially or completely) match one of the
 *  strings in the include array will be returned. Default: []
 *  @property [exclude] - Negative filter the items: only items which DO NOT (partially or completely) match any of
 *  the strings in the exclude array will be returned. Default: []
 *  @property [readContent] - Adds the content of the file into the item (base64 format). Default: false
 *  @property [encoding] - Sets the encoding format to use in the readFile FS native node function
 *  (ascii, base64, binary, hex, ucs2/ucs-2/utf16le/utf-16le, utf8/utf-8, latin1). Default: 'base64'
 */
export interface IOptions {
    /** The list will return an array of items. The tree will return the items structured like the file system.
     *  Default: LIST */
    mode?: any;
    /** If true, files and folders of folders and subfolders will be listed. If false, only the files and folders
     *  of the select directory will be listed. Default: true */
    recursive?: boolean;
    /** If true a stats object (with file information) will be added to every item. If false this info is not added.
     *  Default: false. */
    stats?: any;
    /** If true and mode is LIST, the list will be returned with files only. If true and mode is TREE, the directory
     *  structures without files will be deleted. If false, all empty and non empty directories will be listed.
     *  Default: true */
    ignoreFolders?: boolean;
    /** If true, lowercase extensions will be added to every item in the extension object property
     *  (file.TXT => info.extension = ".txt"). Default: false */
    extensions?: boolean;
    /** If true, folder depth information will be added to every item starting with 0 (initial path), and will be
     *  incremented by 1 in every subfolder. Default: false */
    deep?: boolean;
    /** Computes the canonical pathname by resolving ., .. and symbolic links. Default: true */
    realPath?: boolean;
    /** Normalizes windows style paths by replacing double backslahes with single forward
     *  slahes (unix style). Default: true */
    normalizePath?: boolean;
    /** Positive filter the items: only items which DO (partially or completely) match one of the
     *  strings in the include array will be returned. Default: [] */
    include?: string[];
    /** Negative filter the items: only items which DO NOT (partially or completely) match any of the
     *  strings in the exclude array will be returned. Default: [] */
    exclude?: string[];
    /** Adds the content of the file into the item (base64 format). Default: false */
    readContent?: boolean;
    /** Sets the encoding format to use in the readFile FS native node function (ascii, base64, binary, hex,
     *  ucs2/ucs-2/utf16le/utf-16le, utf8/utf-8, latin1). Default: 'base64' */
    encoding?: BufferEncoding;
}
/**
 * Definition for the common dto object that contains information of the files and folders
 * @typedef IBase
 * @type {object}
 * @property name - The filename of the file
 * @property title - The title of the file (no extension)
 * @property path - The path of the item
 * @property fullname - The fullname of the file (path & name & extension)
 * @property extension - The extension of the file with dot in lowercase
 * @property deep - The depth of current content
 * @property isDirectory - True for directory, false for files
 * @property error - The error object. The structure is variable
 * @property custom - Custom key to add custom properties
 */
export interface IBase {
    /** The filename of the file */
    name: string;
    /** The filename of the file (buffer version) */
    nameb: Buffer;
    /** The title of the file (no extension) */
    title: string;
    /** The path of the file */
    path: string;
    /** The path of the file (buffer version) */
    pathb: Buffer;
    /** The fullname of the file (path & name & extension) */
    fullname: string;
    /** The fullname of the file (path & name & extension buffer version) */
    fullnameb: Buffer;
    /**  The extension of the file with dot in lowercase */
    extension?: string;
    /** The depth of current content */
    deep?: number;
    /** True for directory, false for files */
    isDirectory?: boolean;
    /** If something goes wrong the error comes here */
    error?: IError | any;
    /** Custom key to add custom properties */
    custom?: any;
}
/**
 * Definition for the main Error object that contains information of the current exception
 * @typedef IError
 * @type {object}
 * @property error - The error object. The structure is variable
 * @property path - The path where the error is related to
 */
export interface IError {
    /** The raw error returned by service */
    error: any;
    /** Path where the error raises exception */
    path: string;
    [index: number]: any;
}
/**
 * Definition for the Item object that contains information of files used in this module
*  @typedef IFile
*  @type {object}
*  @property name - The filename of the file
*  @property path - The path of the file
*  @property title - The title of the file (no extension)
*  @property fullname - The fullname of the file (path & name)
*  @property [extension] - The extension of the file in lowercase
*  @property [isDirectory] - Always false in files
*  @property [data] - The content of the file in a base64 string by default
*  @property [stats] - The stats (information) of the file
*  @property [error] - If something goes wrong the error comes here
*  @property [deep] - The depth of current content
*/
export interface IFile extends IBase {
    /** The content of the file in a base64 string by default */
    data?: string;
    /** The stats (information) of the file */
    stats?: _fs.Stats;
}
/**
 * Definition for the Item object that contains information of folders used but this module
*  @typedef IFolder
*  @type {object}
*  @property name - The filename of the folder
*  @property path - The path of the folder
*  @property title - The title of the file (no extension)
*  @property fullname - The fullname of the folder (path & name)
*  @property [extension] - The extension of the folder in lowercase
*  @property [isDirectory] - Always true in folders
*  @property [content] - Array of File/Folder content
*  @property [error] - If something goes wrong the error comes here
*  @property [deep] - The depth of current content
*/
export interface IFolder extends IBase {
    /** The content of the Folder (if any) */
    content?: (IFile | IFolder)[] | IError;
}
/**
*  @typedef CallbackFunction
*  @type {function}
*  @param item - The item object with all the required fields
*  @param index - The current index in the array/collection of Files and/or Folders
*  @param total - The total number of Files and/or Folders
*  @returns {boolean} - true to delete the item from the list
*/
export interface ICallback {
    /** The item object with all the required fields */
    item: IFile | IFolder;
    /** The current index in the array/collection of Files and/or Folders */
    index: number;
    /** The total number of Files and/or Folders */
    total: number;
}
/** @readonly constant for mode LIST to be used in Options */
export declare const LIST = 1;
/** @readonly constant for mode TREE to be used in Options */
export declare const TREE = 2;
/**
 * native FS module
 * @see https://nodejs.org/api/fs.html#fs_file_system
 * @external
 */
import * as _fs from 'fs';
/** native node fs object */
export declare const FS: typeof _fs;
/**
 * native PATH module
 * @external
 * @see https://nodejs.org/api/path.html#path_path
 */
import * as _path from 'path';
/** native node path object */
export declare const PATH: _path.PlatformPath;
/**
 * Returns a Promise with Stats info of the item (file/folder/...)
 * @param file the name of the object to get stats from
 * @returns {Promise<fs.Stats>} stat object information
 * @async
 */
export declare function stat(buffer: Buffer): Promise<_fs.Stats>;
/**
 * Returns a Promise with content (data) of the file
 * @param file the name of the file to read content from
 * @param encoding format for returned data (ascii, base64, binary, hex, ucs2/ucs-2/utf16le/utf-16le,
 *  utf8/utf-8, latin1). Default: base64
 * @returns {Promise<string>} data content string (base64 format by default)
 * @async
 */
export declare function readFile(file: Buffer, encoding?: BufferEncoding | undefined): Promise<string>;
/**
 * Returns a javascript object with directory items information (non blocking async with Promises)
 * @param path the path to start reading contents
 * @param [options] options (mode, recursive, stats, ignoreFolders)
 * @param [progress] callback with item data and progress info for each item
 * @returns promise array with file/folder information
 * @async
 */
export declare function list(path: string, options?: IOptions | Function, progress?: Function): Promise<(IFile | IFolder)[] | IError | any>;

[![CI Build](https://github.com/m0rtadelo/recursive-readdir-async/actions/workflows/ci.pages.yaml/badge.svg)](https://github.com/m0rtadelo/recursive-readdir-async/actions/workflows/ci.pages.yaml)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=m0rtadelo_recursive-readdir-async&metric=coverage)](https://sonarcloud.io/summary/new_code?id=m0rtadelo_recursive-readdir-async)
[![Known Vulnerabilities](https://snyk.io/test/github/m0rtadelo/recursive-readdir-async/badge.svg?targetFile=package.json)](https://snyk.io/test/github/m0rtadelo/recursive-readdir-async?targetFile=package.json)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=m0rtadelo_recursive-readdir-async&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=m0rtadelo_recursive-readdir-async)
![GitHub top language](https://img.shields.io/github/languages/top/m0rtadelo/recursive-readdir-async.svg)
[![npm version](https://badge.fury.io/js/recursive-readdir-async.svg)](https://badge.fury.io/js/recursive-readdir-async)
# recursive-readdir-async
NPM Module to recursive read directory async (non blocking). Returns Promise. Configurable, with callback for extended filtering and progress status. Quiet, NO dependencies. As non blocking module it is perfect to be used in any javascript based Desktop applications. 

>This module uses Promises and can't be used in old javascript engines.

>Compatible with CommonJS (require key) and ES6 (import key).

>Compatible with Javascript and Typescript projects (with types)

>Works with invalid filenames (special characters)

## Installation
For normal usage into a project, you must install as a NPM dependency. The next command will do all the work:
```
npm install --save recursive-readdir-async
```
After install, you can use the module using the *require* key (CommonJS):
```javascript
// Assign recursive-readdir-async to constant
const rra = require('recursive-readdir-async')
// use it
```
or using the *import* key (ES6):
```typescript
// Import ES6 module
import * as rra from 'recursive-readdir-async'
// or
import { list } from 'recursive-readdir-async'
// use it
```
## Usage
Example of basic usage:
```javascript
const result = await rra.list('.');
console.log(result)
```
```javascript
rra.list('.').then(function(result){
    console.log(result)
})
```
Example with full features:
```javascript
const options = {
    mode: rra.LIST,
    recursive: true,
    stats: false,
    ignoreFolders: true,
    extensions: false,
    deep: false,
    realPath: true,
    normalizePath: true,
    include: [],
    exclude: [],
    readContent: false,
    encoding: 'base64'
}
const result = await rra.list('.', options, function (obj, index, total) {
    console.log(`${index} of ${total} ${obj.path}`)
    obj.custom = { foo: 'bar' };// use custom key to inject custom properties
    if(obj.name=="folder2")
        return true;// return true to delete item from the result array
})
if(result.error)
    console.error(result.error)
else
    console.log(result)
```
## Options
An options object can be passed to configure the module. The next options can be used:
* **mode (LIST | TREE)** : The list will return an array of items. The tree will return the items structured like the file system. *Default: list*
* **recursive (true | false)** : If true, files and folders of folders and subfolders will be listed. If false, only the files and folders of the select directory will be listed. *Default: true*
* **stats (true | false)** : If true a `stats` object ([with file information](https://nodejs.org/api/fs.html#fs_class_fs_stats)) will be added to every item. If false this info is not added. *Default: false*
* **ignoreFolders (true | false)** : If true and mode is LIST, the list will be returned with files only. If true and mode is TREE, the directory structures without files will be deleted. If false, all empty and non empty directories will be listed. *Default: true*
* **extensions (true | false)** : If true, lowercase extensions will be added to every item in the `extension` object property (`file.TXT` => `info.extension = ".txt"`). *Default: false*
* **deep (true | false)** : If true, folder depth information will be added to every item starting with 0 (initial path), and will be incremented by 1 in every subfolder. *Default: false*
* **normalizePath (true | false)** : Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style). *Default: true*
* **realPath (true | false)** : Computes the canonical pathname by resolving `.`, `..` and symbolic links. *Default: true*
* **include (Array of String)** : Positive filter the items: only items which [DO](http://www.ietf.org/rfc/rfc2119.txt) (partially or completely) match one of the strings in the `include` array will be returned. *Default: []*
* **exclude (Array of String)** : Negative filter the items: only items which [DO NOT](http://www.ietf.org/rfc/rfc2119.txt) (partially or completely) match *any* of the strings in the `exclude` array will be returned. *Default: []*
* **readContent (true | false)** : Adds the content of the file into the item (base64 format). *Default: false*
* **encoding (String)**: Sets the encoding of the file data  (ascii, base64, binary, hex, ucs2/ucs-2/utf16le/utf-16le, utf8/utf-8, latin1). *Default: base64*

### Notes
* Counter-intuitive to some folks, an *empty* `include` array is treated same as setting it to `null` / `undefined`: no include filter will be applied.
  Obviously, an *empty* `exclude` array acts similar: no `exclude` filter will be applied.
* The `include` and `exclude` options interact.

  **When `mode` is TREE**

  * Directories which [DO NOT](http://www.ietf.org/rfc/rfc2119.txt) match the `include` criteria themselves but contain items which [DO](http://www.ietf.org/rfc/rfc2119.txt) *are kept* in the returned items tree. I.e. *inclusion of the child* has precedence over *rejection of the parent*.
  * Directories which [DO](http://www.ietf.org/rfc/rfc2119.txt) match one of the `exclude` criteria themselves but contain items which [DO NOT](http://www.ietf.org/rfc/rfc2119.txt) *will not* be kept in the returned items tree. I.e. *exclusion of the parent* has precedence over *remaining of the child*.

  **When `mode` is LIST**

  As the directory tree is flattened into a list, directories and their children (subdirectories and files) are filtered through the `exclude` and `include` rules independently, hence `include` and `exclude` will only interact when an item matches *both* filters. See below:

  **Common ground: `mode` is LIST or TREE**

  * `exclude` has precedence over `include`: exclusion rules are applied before the inclusion rules. Hence when an item matches both a string in the `include` array and a string in the `exclude` array, the item will be *excluded* (removed) from the list.
* Reading data from the filesystem can have unexpected behaviors. Use the `readContent` option with responsability.

## Object structure
The function will return an object and never throw an error. All errors will be added to the returned object. The return object in LIST mode looks like this:
```json
[
    {
        "name":"item_name",
        "nameb":<Buffer .. .. ..>,
        "title":"item_name",
        "path":"/absolute/path/to/item",
        "pathb":<Buffer .. .. ..>,
        "fullname":"/absolute/path/to/item/item_name",
        "fullnameb":<Buffer .. .. ..>,
        "extension":"",
        "isDirectory": true,
        "stats":{

        }
    },
    {
        "name":"file.txt",
        "nameb":<Buffer .. .. ..>,
        "title":"file",
        "path":"/absolute/path/to/item/item_name",
        "pathb":<Buffer .. .. ..>,
        "fullname":"/absolute/path/to/item/item_name/file.txt",
        "fullnameb":<Buffer .. .. ..>,
        "extension":".txt",
        "isDirectory": false,
        "data": "base64/utf8/etc.",
        "stats":{

        }
    },
    {
        "name":"UCASE.JPEG",
        "nameb":<Buffer .. .. ..>,
        "title":"UCASE",
        "path":"/absolute/path/to/item/item_name",
        "pathb":<Buffer .. .. ..>,
        "fullname":"/absolute/path/to/item/item_name/UCASE.JPEG",
        "fullnameb":<Buffer .. .. ..>,
        "extension":".jpeg",
        "isDirectory": false,
        "data": "base64/utf8/etc.",
        "stats":{

        }
    }
]
```
The same example for TREE mode:
```json
[
    {
        "name":"item_name",
        "nameb":<Buffer .. .. ..>,
        "title":"item_name",
        "path":"/absolute/path/to/item",
        "pathb":<Buffer .. .. ..>,
        "fullname":"/absolute/path/to/item/item_name",
        "fullnameb":<Buffer .. .. ..>,
        "isDirectory": true,
        "stats":{

        },
        "content": [
            {
                "name":"file.txt",
                "nameb":<Buffer .. .. ..>,
                "title":"file",
                "path":"/absolute/path/to/item/item_name",
                "pathb":<Buffer .. .. ..>,
                "fullname":"/absolute/path/to/item/item_name/file.txt",
                "fullnameb":<Buffer .. .. ..>,
                "extension":".txt",
                "isDirectory": false,
                "data": "base64/utf8/etc.",
                "stats":{

                }
            },
            {
                "name":"UCASE.JPEG",
                "nameb":<Buffer .. .. ..>,
                "title":"UCASE",
                "path":"/absolute/path/to/item/item_name",
                "pathb":<Buffer .. .. ..>,
                "fullname":"/absolute/path/to/item/item_name/UCASE.JPEG",
                "fullnameb":<Buffer .. .. ..>,
                "extension":".jpeg",
                "isDirectory": false,
                "data": "base64/utf8/etc.",
                "stats":{

                }
            }
        ]
    }
]
```
>`isDirectory` only exists if `stats`, `recursive`,`readContent` or `ignoreFolders` are `true` or `mode` is TREE

>`stats` only exists if `options.stats` is `true`

>`extension` only exists if `options.extensions` is `true`

>`data` only exists if `options.readContent` is `true`

>`custom` only exists if includes custom properties
## Errors handling
All errors will be added to the returned object. If an error occurs on the main call, the error will be returned like this:
```json
{
    "error":
        {
            "message": "ENOENT: no such file or directory, scandir '/inexistentpath'",
            "errno": -4058,
            "code": "ENOENT",
            "syscall": "scandir",
            "path": "/inexistentpath"
        },
    "path":"/inexistentpath"
}
```
For errors with files and folders, the error will be added to the item like this:
```json
[
    {
        "name":"item_name",
        "nameb":<Buffer .. .. ..>,
        "title":"item_name",
        "path":"/absolute/path/to/item",
        "pathb":<Buffer .. .. ..>,
        "fullname":"/absolute/path/to/item/item_name",
        "fullnameb":<Buffer .. .. ..>,
        "error":{

        }
    },
    {
        "name":"file.txt",
        "nameb":<Buffer .. .. ..>,
        "title":"file",
        "path":"/absolute/path/to/item",
        "pathb":<Buffer .. .. ..>,
        "fullname":"/absolute/path/to/item/file.txt",
        "fullnameb":<Buffer .. .. ..>,
        "error":{

        }
    }
]
```
More information on: https://m0rtadelo.github.io/recursive-readdir-async/
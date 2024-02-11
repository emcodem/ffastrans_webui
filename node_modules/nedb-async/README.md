# Nedb-Async

**nedb-async is a simply promise base wrapper methods for 
[Nedb](https://github.com/louischatriot/nedb)**

## Installation
Install with npm
```bash
  npm install nedb-async
```
or with yarn
```bash
  yarn add nedb-async
```

## Usage

It is very simple and to avoid too much complexity all the cursor modifiers for
`find, findOne and count`
methods have to be passed as the last argument in an array.

---

**Very important to know that all the promise base methods starts with async then the method name in camel casing**

- `asyncFind`
- `asyncFindOne`
- `asyncCount`
- `asyncInsert`
- `asyncUpdate`
- `asyncRemove`
- `asyncEnsureIndex`
- `asyncRemoveIndex`

and every other ned`b origin methods are still available.

## Usage:

```js
db.asyncFind({}, [['sort', { name: -1 }], ['limit', 2]])
  .then(function(docs) {})
  .catch(function(error) {})
//Or with async await
async function getUsers() {
  let users = await db.asyncFind({}, [['limit', 100]])
}

async function countAllUsers() {
  let users = await db.asyncCount({})
}
```

For Nodejs

```js
const { AsyncNedb } = require('nedb-async')

const data = new AsyncNedb({
  filename: 'data.db',
  autoload: true,
})
```

## Typescript

For typescript users consider using this approach for better types support

```ts
import AsyncNedb from 'nedb-async'

interface IUser {
  firstName: string
  lastName: string
  age: number
  email: string
}

const User = new Nedb<IUser>({ filename: 'data.db', autoload: true })
```

Please use the official <a href="https://github.com/louischatriot/nedb">Nedb</a> documentation for more information.

## Development
After you've cloned this repo, there are some built-in commands to aid in development:

**Build the package** -  outputs built files to `./dist/`. These are the ones that will ultimately end up in the pacakage.
```bash
npm run-script build
```
or
```bash
yarn build
```
**Linter** - runs standard lint checks to keep code clean.
```bash
npm run-script lint
```
or
```bash
yarn lint
```
**Formatter** - formats the code **in place** for consistency.
```bash
npm run-script format
```
or
```bash
yarn format
```

## Licence

MIT

## Semaphore

Naive resource management / concurrency primitive

`npm i @calebboyd/semaphore`

### Example
```javascript
import { Semaphore } from '@calebboyd/semaphore'
import { something } from './somewhere'

function doSomeWork () {
  const lock = new Semaphore(10)
  while(something.isTrue) {
    lock.acquire().then(x => () => {
      something.work().then(lock.release)
    })    
  }
}
```
The semaphore will only allow 10 locks to be aquired at a time. This limits the concurrency of the asyncronous function `something.work` to 10

#### API: 

```typescript
export class Semaphore {
  constructor (count: number) {}
  acquire(): Promise<void>
  release(): void
}
```

## License

MIT

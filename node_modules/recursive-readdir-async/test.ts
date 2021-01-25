import * as rra from './build/module.esm'

console.log('start')
rra.list('./test').then(data => {
    console.log(data)
})
console.log('end')
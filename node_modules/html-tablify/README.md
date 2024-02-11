# html-tablify

### This package is used to convert json data to html. 

### Installation -

```
npm install html-tablify
```

### How to use -

* Basic usage -
```
var html_tablify = require('html-tablify');
var options = {
    data: [{a: 1, b: 2}, {b: 1, a: 2}, {a: 4}]
};
var html_data = html_tablify.tablify(options);
console.log(html_data);
```
* Output (pretty) -
```
<table border=1 cellspacing=0 cellpadding=0>
    <thead>
        <tr> <th>a</th> <th>b</th> </tr>
    </thead>
    </tbody>
        <tr> <td>1</td> <td>2</td> </tr>
        <tr> <td>2</td> <td>1</td> </tr>
        <tr> <td>4</td> <td> </td> </tr>
    </tbody>
</table>
```

---

* To specify order of header use 'header' (array) in options -
```
var html_tablify = require('html-tablify');
var options = {
    data: [{a: 1, b: 2}, {b: 1, a: 2}, {a: 4, c: 5}],
    header: ['a', 'b', 'c']
};
var html_data = html_tablify.tablify(options);
console.log(html_data);
```
* Output (pretty) -
```
<table border=1 cellspacing=0 cellpadding=0>
    <thead>
        <tr> <th>a</th> <th>b</th> <th>c</th> </tr>
    </thead>
    </tbody>
        <tr> <td>1</td> <td>2</td> <td> </td> </tr>
        <tr> <td>2</td> <td>1</td> <td> </td> </tr>
        <tr> <td>4</td> <td> </td> <td>5</td> </tr>
    </tbody>
</table>
```

---

* To map header text to something else use 'header_mapping' in options -
```
var html_tablify = require('html-tablify');
var options = {
    data: [{a: 1, b: 2}, {b: 1, a: 2}, {a: 4, c: 5}],
    header_mapping: {
        a: 'X',
        c: 'Z'
    }
};
var html_data = html_tablify.tablify(options);
console.log(html_data);
```
* Output (pretty) -
```
<table border=1 cellspacing=0 cellpadding=0>
    <thead>
        <tr> <th>X</th> <th>b</th> <th>Z</th> </tr>
    </thead>
    </tbody>
        <tr> <td>1</td> <td>2</td> <td> </td> </tr>
        <tr> <td>2</td> <td>1</td> <td> </td> </tr>
        <tr> <td>4</td> <td> </td> <td>5</td> </tr>
    </tbody>
</table>
```

---

* To override border(default 1), cellpadding(default 0) and cellspacing(default 0) use 'border', 'cellpadding' and 'cellspacing' in options -
```
var html_tablify = require('html-tablify');
var options = {
    data: [{a: 1, b: 2}, {b: 1, a: 2}, {a: 4, c: 5}],
    border: 5,
    cellspacing: 2,
    cellpadding: 3
};
var html_data = html_tablify.tablify(options);
console.log(html_data);
```
* Output (pretty) -
```
<table border=5 cellspacing=2 cellpadding=3>
    <thead>
        <tr> <th>a</th> <th>b</th> <th>c</th> </tr>
    </thead>
    </tbody>
        <tr> <td>1</td> <td>2</td> <td> </td> </tr>
        <tr> <td>2</td> <td>1</td> <td> </td> </tr>
        <tr> <td>4</td> <td> </td> <td>5</td> </tr>
    </tbody>
</table>
```

---

* To apply styling (css) use 'css' in options -
```
var html_tablify = require('html-tablify');
var options = {
    data: [{a: 1, b: 2}, {b: 1, a: 2}, {a: 4, c: 5}],
    css: 'table {border: 1px solid red}'
};
var html_data = html_tablify.tablify(options);
console.log(html_data);
```
* Output (pretty) -
```
<style>
    table {
        border: 1px solid red
    }
</style>
<table border=1 cellspacing=0 cellpadding=0>
    <thead>
        <tr> <th>a</th> <th>b</th> <th>c</th> </tr>
    </thead>
    </tbody>
        <tr> <td>1</td> <td>2</td> <td> </td> </tr>
        <tr> <td>2</td> <td>1</td> <td> </td> </tr>
        <tr> <td>4</td> <td> </td> <td>5</td> </tr>
    </tbody>
</table>
```

---

* To add class to table use 'table_class' in options -
```
var html_tablify = require('html-tablify');
var options = {
    data: [{a: 1, b: 2}, {b: 1, a: 2}, {a: 4, c: 5}],
    table_class: 'my-table'
};
var html_data = html_tablify.tablify(options);
console.log(html_data);
```
* Output (pretty) -
```
<table border=1 cellspacing=0 cellpadding=0 class="my-table">
    <thead>
        <tr> <th>a</th> <th>b</th> <th>c</th> </tr>
    </thead>
    </tbody>
        <tr> <td>1</td> <td>2</td> <td> </td> </tr>
        <tr> <td>2</td> <td>1</td> <td> </td> </tr>
        <tr> <td>4</td> <td> </td> <td>5</td> </tr>
    </tbody>
</table>
```

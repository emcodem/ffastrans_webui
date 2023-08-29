/* jslint node: true, mocha: true */
'use strict';

var util = require('util');
var assert = require('assert');
var html_tablify = require('./index');

var usecases = [
    {
        name: 'Null options',
        options: null,
        result: ''
    },
    {
        name: 'Empty options',
        options: {
        },
        result: ''
    },
    {
        name: 'Data as object',
        options: {
            pretty: false,
            data: {
                p: 123,
                q: undefined,
                r: null,
                s: 'ABCD',
                t: {
                    x: 1,
                    y: 2,
                    z: 3
                }
            }
        },
        result: '<table id="tablify" class="tablify" border="1" cellspacing="0" cellpadding="0"><tr><th>p</th><td>123</td></tr><tr><th>s</th><td>ABCD</td></tr><tr><th>t</th><td>{"x":1,"y":2,"z":3}</td></tr></table>'
    },
    {
        name: 'Data as array',
        options: {
            pretty: false,
            data: [
                {
                    p: 123,
                    q: undefined,
                    r: null,
                    s: 'ABCD',
                    t: {
                        x: 1,
                        y: 2,
                        z: 3
                    }
                }
            ]
        },
        result: '<table id="tablify" class="tablify" border="1" cellspacing="0" cellpadding="0"><tr><th>p</th><th>q</th><th>r</th><th>s</th><th>t</th></tr><tr><td>123</td><td></td><td>null</td><td>ABCD</td><td>{"x":1,"y":2,"z":3}</td></tr></table>'
    },
    {
        name: 'Data as array with pretty',
        options: {
            pretty: true,
            data: [
                {
                    p: 123,
                    q: undefined,
                    r: null
                },
                {
                    a: 'w',
                    b: 't',
                    p: 'f'
                }
            ]
        },
        result: "<table id=\"tablify\" class=\"tablify\" border=\"1\" cellspacing=\"0\" cellpadding=\"0\">\n  <tr>\n    <th>p</th>\n    <th>q</th>\n    <th>r</th>\n    <th>a</th>\n    <th>b</th>\n  </tr>\n  <tr>\n    <td>123</td>\n    <td></td>\n    <td>null</td>\n    <td></td>\n    <td></td>\n  </tr>\n  <tr>\n    <td>f</td>\n    <td></td>\n    <td></td>\n    <td>w</td>\n    <td>t</td>\n  </tr>\n</table>"
    },
    {
        name: 'header',
        options: {
            pretty: false,
            header: ['b', 'r', 'p', 'a'],
            data: [
                {
                    p: 123,
                    q: undefined,
                    r: null
                },
                {
                    a: 'w',
                    b: 't',
                    p: 'f'
                }
            ]
        },
        result: '<table id="tablify" class="tablify" border="1" cellspacing="0" cellpadding="0"><tr><th>b</th><th>r</th><th>p</th><th>a</th></tr><tr><td></td><td>null</td><td>123</td><td></td></tr><tr><td>t</td><td></td><td>f</td><td>w</td></tr></table>'
    },
    {
        name: 'header_mapping',
        options: {
            pretty: false,
            header: ['b', 'r', 'p', 'a'],
            header_mapping: {
                r: 'Relax',
                a: 'AB Dev'
            },
            data: [
                {
                    p: 123,
                    q: undefined,
                    r: null
                },
                {
                    a: 'w',
                    b: 't',
                    p: 'f'
                }
            ]
        },
        result: '<table id="tablify" class="tablify" border="1" cellspacing="0" cellpadding="0"><tr><th>b</th><th>Relax</th><th>p</th><th>AB Dev</th></tr><tr><td></td><td>null</td><td>123</td><td></td></tr><tr><td>t</td><td></td><td>f</td><td>w</td></tr></table>'
    },
    {
        name: 'table_id',
        options: {
            pretty: false,
            table_id: 123,
            data: {
                a: 1,
                b: '2',
                c: 3
            }
        },
        result: '<table id="123" class="tablify" border="1" cellspacing="0" cellpadding="0"><tr><th>a</th><td>1</td></tr><tr><th>b</th><td>2</td></tr><tr><th>c</th><td>3</td></tr></table>'
    },
    {
        name: 'table_class',
        options: {
            pretty: false,
            table_class: 'my_class',
            data: {
                a: 1,
                b: '2',
                c: 3
            }
        },
        result: '<table id="tablify" class="my_class" border="1" cellspacing="0" cellpadding="0"><tr><th>a</th><td>1</td></tr><tr><th>b</th><td>2</td></tr><tr><th>c</th><td>3</td></tr></table>'
    },
    {
        name: 'border, cellpadding, cellspacing',
        options: {
            pretty: false,
            table_id: '12345',
            table_class: '789',
            border: 2,
            cellpadding: 3,
            cellspacing: 4,
            data: {
                a: 1,
                b: '2',
                c: 3
            }
        },
        result: '<table id="12345" class="789" border="2" cellspacing="4" cellpadding="3"><tr><th>a</th><td>1</td></tr><tr><th>b</th><td>2</td></tr><tr><th>c</th><td>3</td></tr></table>'
    }
];

describe('tablify', function () {
    it('Initialize', function (done) {
        describe('tablify', function () {
            usecases.forEach(function (usecase) {
                it(usecase.name, function (cb) {
                    var result = html_tablify.tablify(usecase.options);
                    assert.equal(result, usecase.result);
                    return cb();
                });
            });
        });
        done();
    });
});

var _ = require('../node_modules/underscore');
var config = require('./config').config;
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var username = 'gheeres';
var groups = [ 'CPS-CST List', 'cps-cst-admin list' ];


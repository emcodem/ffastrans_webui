var _ = require('underscore');
var ldap = require('ldapjs');
var config = require('./config').config;
var ActiveDirectory = require('../../index');

var activeDirectory = new ActiveDirectory(config);
var ad = activeDirectory;

function handleResult(err, result) {
  if (err) {
    console.log('ERROR: ' + err);
    return;
  }

  console.log(result);	
}

ad.getRootDSE(handleResult);
ad.getRootDSE(config.url, [ 'defaultNamingContext' ], handleResult);
ActiveDirectory.prototype.getRootDSE(config.url, handleResult);
ActiveDirectory.prototype.getRootDSE(config.url, [ 'defaultNamingContext' ], handleResult);


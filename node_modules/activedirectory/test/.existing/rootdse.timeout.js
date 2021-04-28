var _ = require('../node_modules/underscore');
var config = require('./config').config;
var ActiveDirectory = require('../index');

function handleResult(err, result) {
  if (err) {
    console.log('ERROR: ' + err);
    return;
  }

  console.log(result);	
}

var url = 'ldap://127.0.0.2';
var url = 'ldap://uwsp.edu';
ActiveDirectory.prototype.getRootDSE(url, handleResult);

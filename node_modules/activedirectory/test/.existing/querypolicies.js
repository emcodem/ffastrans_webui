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

var opts = { 
  baseDn: 'CN=Query-Policies,CN=Directory Service,CN=Windows NT,CN=Services,CN=Configuration,DC=uwsp,DC=edu', 
  filter: 'objectClass=*' 
};
ad.find(opts, function(err, result) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(result);
});

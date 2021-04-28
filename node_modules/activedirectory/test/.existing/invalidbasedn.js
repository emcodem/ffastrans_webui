var _ = require('../node_modules/underscore');
var config = require('./config').config;
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;


var opts = {
  baseDN: 'dc=uwsp,dc=com'
};
ad.findUsers(opts, 'userPrincipalName=gheer565@uwsp.edu', function(err, results) {
  if (err) {
    console.log('CLIENT ERROR: ' +JSON.stringify(err));
    return;
  }
  console.log('CLIENT RESULTS: ' +JSON.stringify(results));
});

var opts = {
  baseDN: 'ou=Notvalid,dc=uwsp,dc=edu'
};
ad.findUsers(opts, 'userPrincipalName=gheer565@uwsp.edu', function(err, results) {
  if (err) {
    console.log('CLIENT ERROR: ' +JSON.stringify(err));
    return;
  }
  console.log('CLIENT RESULTS: ' +JSON.stringify(results));
});

ad = new (require('../index'))(_.defaults({ baseDN: 'dc=uwsp,dc=com' }, config));
ad.findUsers('userPrincipalName=gheer565@uwsp.edu', function(err, results) {
  if (err) {
    console.log('CLIENT ERROR: ' +JSON.stringify(err));
    return;
  }
  console.log('CLIENT RESULTS: ' +JSON.stringify(results));
});

ad = new (require('../index'))(_.defaults({ baseDN: 'ou=Notvalid,dc=uwsp,dc=edu' }, config));
ad.findUsers('userPrincipalName=gheer565@uwsp.edu', function(err, results) {
  if (err) {
    console.log('CLIENT ERROR: ' +JSON.stringify(err));
    return;
  }
  console.log('CLIENT RESULTS: ' +JSON.stringify(results));
});

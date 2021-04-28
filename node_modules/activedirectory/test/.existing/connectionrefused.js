var _ = require('../node_modules/underscore');
var config = require('./config');

var timeoutHost = 'ldap://cps.uwsp.edu';
var activeDirectory = new (require('../index'))(_.defaults({ url: timeoutHost }, config.config));
var ad = activeDirectory;

activeDirectory.find('userPrincipalName=gheer565@uwsp.edu', function(err, results) {
  if (err) {
    console.log('CLIENT ERROR: ' +JSON.stringify(err));
    return;
  }
  console.log('CLIENT RESULTS: ' +JSON.stringify(results));
});

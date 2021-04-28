var _ = require('../node_modules/underscore');
var config = require('./config');

var invalidHost = 'ldap://cps102-wd-01-X.uwsp.edu';
var activeDirectory = new (require('../index'))(_.defaults({ url: invalidHost }, config.config));
var ad = activeDirectory;

activeDirectory.find('userPrincipalName=gheer565@uwsp.edu', function(err, results) {
  if (err) {
    console.log('CLIENT ERROR: ' +JSON.stringify(err));
    return;
  }
  console.log('CLIENT RESULTS: ' +JSON.stringify(results));
});

var _ = require('../node_modules/underscore');
var config = require('./config');
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var username ='bob@uwsp.edu';
var password = 'password';

activeDirectory.authenticate(username, password, function(err, authenticated) {
  if (err) {
    console.log('CLIENT ERROR: ' +JSON.stringify(err));
    return;
  }
  console.log('CLIENT RESULTS: ' +JSON.stringify(results));
});

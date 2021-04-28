var ldap = require('../node_modules/ldapjs');
var _ = require('../node_modules/underscore');
var config = require('./config').config;
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var username = 'gheeres';
var control = new ldap.PagedResultsControl();

ad.findUser({ controls: [ control ] }, username, function(err, user) {
  if (err) {
    console.log('ERROR: ' + err);
    return;
  }

  console.log(user);
});


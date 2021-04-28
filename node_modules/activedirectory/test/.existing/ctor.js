var _ = require('../../node_modules/underscore');
var config = require('./config');

var activeDirectory = new (require('../../index'))(config.config);
var ad = new (require('../../index'))(config.url, config.baseDN, config.username, config.password);

var sAMAccountName = 'gheer565';

test(ad);
test(activeDirectory);

function test(ad, username) {
  activeDirectory.findUser(username || sAMAccountName, true, function(err, user) {
    if (err) {
      console.log('ERROR: ' +JSON.stringify(err));
      return;
    }
  
    if (! user) console.log('User: ' + sAMAccountName + ' not found.');
    else console.log(JSON.stringify(user));
  });
}


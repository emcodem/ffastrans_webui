var _ = require('../node_modules/underscore');
var config = require('./config').config;
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

var opts = { 
  baseDN: 'OU=Special,OU=UWSP Users,DC=uwsp,DC=edu',
  filter: '(cn=*George*)'
};
activeDirectory.findUsers(opts, function(err, users) {
  if (err) {
    console.log('ERROR: ' + err);
    return;
  }

  console.log('Users');
  _.each(users || [], function(user) {
    console.log('  ' + user.cn);
  });
});

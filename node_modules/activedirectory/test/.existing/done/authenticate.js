var _ = require('../node_modules/underscore');
var config = require('./config').config;
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;


var password = '!acissej69';
var users = [
  { username: 'gheer565', password: password },
  { username: 'gheer565@uwsp.edu', password: password },
  { username: 'UWSPDOM\\gheer565', password: password },
];

_.each(users, function(user) {
  ad.authenticate(user.username, user.password, function(err, authenticated) {
    if (err) {
      console.log('ERROR ('+user.username+'): ' + err);
      return;
    }
    console.log(user.username+' Authenticated');
  });
});

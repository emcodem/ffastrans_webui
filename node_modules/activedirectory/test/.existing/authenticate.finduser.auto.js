var _ = require('../node_modules/underscore');
var config = require('./config').config;
//config.logging.streams[0].level = 'trace';
var activeDirectory = new (require('../index'))(_.omit(config, 'username', 'password'));
var ad = activeDirectory;

var username = 'gheer565@uwsp.edu';
var password = '!acissej69';

ad.authenticate(username, password, function(err, auth) {
  if (err) {
    console.log('ERROR: '+JSON.stringify(err));
    return;
  }

  if (auth) {
    console.log('Authenticated...');

    var opts = {
      bindDN: username,
      bindCredentials: password
    };
//    ad.opts.bindDN = username;
//    ad.opts.bindCredentials = password;
    ad.findUser(opts, username, function(err, user) {
      if (err) {
        console.log('ERROR: ' +JSON.stringify(err));
        return;
      }

      if (! user) console.log('User: ' + username + ' not found.');
      else console.log(JSON.stringify(user));
    });
  }
  else {
    console.log('Authentication failed!');
  }
});

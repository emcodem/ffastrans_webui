var _ = require('../../node_modules/underscore');
var config = require('./config').config;

config.url = 'ldaps://uwsp.edu';
config.tlsOptions = {
  rejectUnauthorized: false
};

var activeDirectory = new (require('../../index'))(config);
var ad = activeDirectory;

var username = 'gheer565@uwsp.edu';
var password = '!acissej69';

ad.authenticate(username, password, function(err, auth) {
  if (err) {
    console.log('ERROR: ' + JSON.stringify(err));
    return;
  }

  if (auth) {
    console.log('AUTHENTICATED!!!');
    ad.findUser(username, function(err, user) {
      if (err) {
        console.log('ERROR: ' + JSON.stringify(err));
        return;
      }

      console.log(user);
    });
  } else {
    console.log('AUTHENTICATION FAILED...');
  }
});


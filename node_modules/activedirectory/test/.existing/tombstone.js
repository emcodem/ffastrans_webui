var _ = require('../node_modules/underscore');
var config = require('./config').config;
var activeDirectory = new (require('../index'))(config);
var ad = activeDirectory;

ad.findDeletedObjects({}, function(err, results) {
  if (err) {
    console.log('ERROR: '+err);
    return;
  }

  console.log(results);
});

var expect = require('chai').expect;
var normalizeQueryParams = require('./');

describe('normalize query params', function() {
  var req;

  beforeEach(function() {
    req = {
      query: {
        someparam: 5,
        alreadyCorrectParam: 42
      }
    };
  });

  it('should normalize configured params', function(done) {
    normalizeQueryParams(['someParam'])(req, null, function() {
      expect(req.query.someParam).to.equal(5);
      done();
    });
  });

  it('should not remove configured params that are passed correctly', function(done) {
    normalizeQueryParams(['alreadyCorrectParam'])(req, null, function() {
      expect(req.query.alreadyCorrectParam).to.equal(42);
      done();
    });
  });
});

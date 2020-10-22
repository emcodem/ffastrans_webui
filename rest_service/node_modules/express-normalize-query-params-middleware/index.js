module.exports = function normalizeQueryParams(params) {
  var lowerCased = params.map(toLowerCase);
  return function expressNormalizeQueryParamsMiddleware(req, res, next) {
    Object.keys(req.query).forEach(function(key) {
      var index = lowerCased.indexOf(key.toLowerCase());
      if (index > -1) {
        req.query[params[index]] = req.query[key];
        if (key !== params[index]) delete req.query[key];
      }
    });
    next();
  };
};

function toLowerCase(item) {
  return item.toLowerCase();
}

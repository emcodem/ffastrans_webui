"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "DefaultHttpStack", {
  enumerable: true,
  get: function () {
    return _httpStack.default;
  }
});
Object.defineProperty(exports, "DetailedError", {
  enumerable: true,
  get: function () {
    return _error.default;
  }
});
exports.Upload = void 0;
Object.defineProperty(exports, "canStoreURLs", {
  enumerable: true,
  get: function () {
    return _urlStorage.canStoreURLs;
  }
});
exports.defaultOptions = void 0;
Object.defineProperty(exports, "enableDebugLog", {
  enumerable: true,
  get: function () {
    return _logger.enableDebugLog;
  }
});
exports.isSupported = void 0;
var _error = _interopRequireDefault(require("../error.js"));
var _logger = require("../logger.js");
var _noopUrlStorage = _interopRequireDefault(require("../noopUrlStorage.js"));
var _upload = _interopRequireDefault(require("../upload.js"));
var _fileReader = _interopRequireDefault(require("./fileReader.js"));
var _fileSignature = _interopRequireDefault(require("./fileSignature.js"));
var _httpStack = _interopRequireDefault(require("./httpStack.js"));
var _urlStorage = require("./urlStorage.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _typeof(o) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, _typeof(o);
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}
function _callSuper(t, o, e) {
  return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));
}
function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  } else if (call !== void 0) {
    throw new TypeError("Derived constructors may only return object or undefined");
  }
  return _assertThisInitialized(self);
}
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self;
}
function _isNativeReflectConstruct() {
  try {
    var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
  } catch (t) {}
  return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {
    return !!t;
  })();
}
function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}
function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  Object.defineProperty(subClass, "prototype", {
    writable: false
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };
  return _setPrototypeOf(o, p);
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function (r) {
      return Object.getOwnPropertyDescriptor(e, r).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
      _defineProperty(e, r, t[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
function _toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
var defaultOptions = exports.defaultOptions = _objectSpread(_objectSpread({}, _upload.default.defaultOptions), {}, {
  httpStack: new _httpStack.default(),
  fileReader: new _fileReader.default(),
  urlStorage: _urlStorage.canStoreURLs ? new _urlStorage.WebStorageUrlStorage() : new _noopUrlStorage.default(),
  fingerprint: _fileSignature.default
});
var Upload = exports.Upload = /*#__PURE__*/function (_BaseUpload) {
  function Upload() {
    var file = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    _classCallCheck(this, Upload);
    options = _objectSpread(_objectSpread({}, defaultOptions), options);
    return _callSuper(this, Upload, [file, options]);
  }
  _inherits(Upload, _BaseUpload);
  return _createClass(Upload, null, [{
    key: "terminate",
    value: function terminate(url) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      options = _objectSpread(_objectSpread({}, defaultOptions), options);
      return _upload.default.terminate(url, options);
    }
  }]);
}(_upload.default); // Note: We don't reference `window` here because these classes also exist in a Web Worker's context.
var isSupported = exports.isSupported = typeof XMLHttpRequest === 'function' && typeof Blob === 'function' && typeof Blob.prototype.slice === 'function';
/*
@license

dhtmlxVault v.3.0.0 GPL

This software is covered by GPL license.
To use it in non-GPL project, you need obtain Commercial or Enterprise license
Please contact sales@dhtmlx.com. Usage without proper license is prohibited.
(c) Dinamenta, UAB.

*/
if (window.dhx){ window.dhx_legacy = dhx; delete window.dhx; }(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["dhx"] = factory();
	else
		root["dhx"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/codebase/";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 27);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var dom = __webpack_require__(43);
exports.el = dom.defineElement;
exports.sv = dom.defineSvgElement;
exports.view = dom.defineView;
exports.create = dom.createView;
exports.inject = dom.injectView;
function disableHelp() {
    dom.DEVMODE.mutations = false;
    dom.DEVMODE.warnings = false;
    dom.DEVMODE.verbose = false;
    dom.DEVMODE.UNKEYED_INPUT = false;
}
exports.disableHelp = disableHelp;
function resizer(handler) {
    return exports.el("iframe", {
        _hooks: {
            didInsert: function (node) {
                var activeHandler = function () {
                    var height = node.el.offsetHeight;
                    var width = node.el.offsetWidth;
                    handler(width, height);
                };
                node.el.contentWindow.onresize = activeHandler;
                activeHandler();
            }
        },
        style: "position:absolute;left:0;top:-100%;width:100%;height:100%;margin:1px 0 0;border:none;opacity:0;visibility:hidden;pointer-events:none;",
    });
}
exports.resizer = resizer;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
__webpack_require__(37);
function toNode(node) {
    if (typeof node === "string") {
        node = (document.getElementById(node) || document.querySelector(node));
    }
    return node || document.body;
}
exports.toNode = toNode;
function eventHandler(prepare, hash) {
    var keys = Object.keys(hash);
    return function (ev) {
        var data = prepare(ev);
        var node = ev.target;
        while (node) {
            var cssstring = node.getAttribute ? (node.getAttribute("class") || "") : "";
            if (cssstring.length) {
                var css = cssstring.split(" ");
                for (var j = 0; j < keys.length; j++) {
                    if (css.indexOf(keys[j]) > -1) {
                        return hash[keys[j]](ev, data);
                    }
                }
            }
            node = node.parentNode;
        }
        return true;
    };
}
exports.eventHandler = eventHandler;
function locate(target, attr) {
    if (attr === void 0) { attr = "dhx_id"; }
    var node = locateNode(target, attr);
    return node ? node.getAttribute(attr) : "";
}
exports.locate = locate;
function locateNode(target, attr) {
    if (attr === void 0) { attr = "dhx_id"; }
    if (target instanceof Event) {
        target = target.target;
    }
    while (target && target.getAttribute) {
        if (target.getAttribute(attr)) {
            return target;
        }
        target = target.parentNode;
    }
}
exports.locateNode = locateNode;
function getBox(elem) {
    var box = elem.getBoundingClientRect();
    var body = document.body;
    var scrollTop = window.pageYOffset || body.scrollTop;
    var scrollLeft = window.pageXOffset || body.scrollLeft;
    var top = box.top + scrollTop;
    var left = box.left + scrollLeft;
    var right = body.offsetWidth - box.right;
    var bottom = body.offsetHeight - box.bottom;
    var width = box.right - box.left;
    var height = box.bottom - box.top;
    return { top: top, left: left, right: right, bottom: bottom, width: width, height: height };
}
exports.getBox = getBox;
var scrollWidth = -1;
function getScrollbarWidth() {
    if (scrollWidth > -1) {
        return scrollWidth;
    }
    var scrollDiv = document.createElement("div");
    document.body.appendChild(scrollDiv);
    scrollDiv.style.cssText = "position: absolute;left: -99999px;overflow:scroll;width: 100px;height: 100px;";
    scrollWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    document.body.removeChild(scrollDiv);
    return scrollWidth;
}
exports.getScrollbarWidth = getScrollbarWidth;
function fitPosition(target, mode, width, height) {
    var right = target.left + target.width;
    var bottom = target.top + target.height;
    if (mode === "bottom") {
        var left = window.innerWidth < target.left + width ? right - width : target.left;
        var top_1 = bottom + height > window.innerHeight ? target.top - height + window.scrollY : bottom + window.scrollY;
        return {
            position: "absolute",
            left: left,
            top: top_1,
            minWidth: width
        };
    }
    else {
        var overflow = void 0;
        var top_2 = target.top + window.scrollY;
        var left = window.innerWidth < right + width ? target.left - width : right;
        if (bottom + height > window.innerHeight) {
            if (bottom - height > 0) {
                top_2 = bottom - height + window.scrollY;
            }
            else {
                overflow = "scroll";
                height = (window.innerHeight - target.top) * 0.8;
            }
        }
        return {
            position: "absolute",
            left: left,
            top: top_2,
            minWidth: width,
            overflow: overflow,
            height: height
        };
    }
}
exports.fitPosition = fitPosition;
function isIE() {
    var ua = window.navigator.userAgent;
    return ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;
}
exports.isIE = isIE;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = __webpack_require__(0);
var types_1 = __webpack_require__(4);
function getCss(item) {
    var className = "";
    if (item.type !== types_1.ItemType.button && item.size) {
        className += " " + item.size;
    }
    if (item.active) {
        className += " active";
    }
    if (item.$disabled) {
        className += " disabled";
    }
    if (item.css) {
        className += " " + item.css;
    }
    return className;
}
exports.getCss = getCss;
function getButtonCss(item) {
    var className = " ";
    className += item.name === "link" ? "dhx_btn--link" : "dhx_btn--flat";
    className += item.size === "large" ? " dhx_btn--large" : " dhx_btn--small";
    switch (item.usage) {
        case "danger":
            className += " dhx_btn--danger";
            break;
        case "secondary":
            className += " dhx_btn--secondary";
            break;
        case "success":
            className += " dhx_btn--success";
            break;
        case "primary":
        default:
            break;
    }
    return className;
}
exports.getButtonCss = getButtonCss;
function counter(item) {
    if (item.count) {
        return dom_1.el(".counter", item.count);
    }
}
exports.counter = counter;
function icon(iconName) {
    if (iconName === void 0) { iconName = ""; }
    var className = "dhx-icon-block ";
    if (iconName.slice(0, 3) === "dxi") {
        className += "dxi ";
    }
    return dom_1.el("div", {
        class: className + iconName
    });
}
exports.icon = icon;


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var counter = (new Date()).valueOf();
function uid() {
    return "u" + (counter++);
}
exports.uid = uid;
function extend(target, source, deep) {
    if (deep === void 0) { deep = true; }
    if (source) {
        for (var key in source) {
            var sobj = source[key];
            var tobj = target[key];
            if (deep && typeof tobj === "object" && !(tobj instanceof Date) && !(tobj instanceof Array)) {
                extend(tobj, sobj);
            }
            else {
                target[key] = sobj;
            }
        }
    }
    return target;
}
exports.extend = extend;
function copy(source) {
    var result = {};
    for (var key in source) {
        result[key] = source[key];
    }
    return result;
}
exports.copy = copy;
function naturalSort(arr) {
    return arr.sort(function (a, b) {
        var nn = typeof a === "string" ? a.localeCompare(b) : a - b;
        return nn;
    });
}
exports.naturalSort = naturalSort;
function findIndex(arr, predicate) {
    var len = arr.length;
    for (var i = 0; i < len; i++) {
        if (predicate(arr[i])) {
            return i;
        }
    }
    return -1;
}
exports.findIndex = findIndex;
function isEqualString(from, to) {
    if (from.length > to.length) {
        return false;
    }
    for (var i = 0; i < from.length; i++) {
        if (from[i].toLowerCase() !== to[i].toLowerCase()) {
            return false;
        }
    }
    return true;
}
exports.isEqualString = isEqualString;
function singleOuterClick(fn) {
    var click = function (e) {
        if (fn(e)) {
            document.removeEventListener("click", click);
        }
    };
    document.addEventListener("click", click);
}
exports.singleOuterClick = singleOuterClick;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = __webpack_require__(5);
exports.DataEvents = types_1.DataEvents;
var ItemType;
(function (ItemType) {
    ItemType["button"] = "button";
    ItemType["input"] = "input";
    ItemType["separator"] = "separator";
    ItemType["text"] = "text";
    ItemType["iconButton"] = "iconButton";
    ItemType["imageButton"] = "imageButton";
    ItemType["spacer"] = "spacer";
    ItemType["menuItem"] = "menuItem";
    ItemType["imageButtonText"] = "imageButtonText";
    ItemType["block"] = "block";
    ItemType["customHTMLButton"] = "customButton";
    ItemType["selectButton"] = "selectButton";
    ItemType["dhxButton"] = "dhx-button";
})(ItemType = exports.ItemType || (exports.ItemType = {}));
var ToolbarEvents;
(function (ToolbarEvents) {
    ToolbarEvents["inputCreated"] = "inputcreated";
    ToolbarEvents["click"] = "click";
})(ToolbarEvents = exports.ToolbarEvents || (exports.ToolbarEvents = {}));
var NavigationType;
(function (NavigationType) {
    NavigationType["pointer"] = "pointer";
    NavigationType["click"] = "click";
})(NavigationType = exports.NavigationType || (exports.NavigationType = {}));


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var DataEvents;
(function (DataEvents) {
    DataEvents["afterAdd"] = "afteradd";
    DataEvents["beforeAdd"] = "beforeadd";
    DataEvents["removeAll"] = "removeall";
    DataEvents["beforeRemove"] = "beforeremove";
    DataEvents["afterRemove"] = "afterremove";
    DataEvents["change"] = "change";
    DataEvents["load"] = "load";
})(DataEvents = exports.DataEvents || (exports.DataEvents = {}));
var DragEvents;
(function (DragEvents) {
    DragEvents["beforeDrag"] = "beforedrag";
    DragEvents["beforeDrop"] = "beforeDrop";
    DragEvents["dragStart"] = "dragstart";
    DragEvents["dragEnd"] = "dragend";
    DragEvents["canDrop"] = "candrop";
    DragEvents["cancelDrop"] = "canceldrop";
    DragEvents["dropComplete"] = "dropcomplete";
    DragEvents["dragOut"] = "dragOut";
    DragEvents["dragIn"] = "dragIn";
})(DragEvents = exports.DragEvents || (exports.DragEvents = {}));
var DragMode;
(function (DragMode) {
    DragMode["target"] = "target";
    DragMode["both"] = "both";
    DragMode["source"] = "source";
})(DragMode = exports.DragMode || (exports.DragMode = {}));
var DragBehaviour;
(function (DragBehaviour) {
    DragBehaviour["child"] = "child";
    DragBehaviour["sibling"] = "sibling";
    DragBehaviour["complex"] = "complex";
})(DragBehaviour = exports.DragBehaviour || (exports.DragBehaviour = {}));
var SelectionEvents;
(function (SelectionEvents) {
    SelectionEvents["beforeUnSelect"] = "beforeunselect";
    SelectionEvents["afterUnSelect"] = "afterunselect";
    SelectionEvents["beforeSelect"] = "beforeselect";
    SelectionEvents["afterSelect"] = "afterselect";
})(SelectionEvents = exports.SelectionEvents || (exports.SelectionEvents = {}));


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = __webpack_require__(5);
exports.DataEvents = types_1.DataEvents;
exports.DragBehaviour = types_1.DragBehaviour;
exports.DragMode = types_1.DragMode;
var TreeFilterType;
(function (TreeFilterType) {
    TreeFilterType[TreeFilterType["all"] = 1] = "all";
    TreeFilterType[TreeFilterType["specific"] = 2] = "specific";
    TreeFilterType[TreeFilterType["leafs"] = 3] = "leafs";
})(TreeFilterType = exports.TreeFilterType || (exports.TreeFilterType = {}));


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var dataproxy_1 = __webpack_require__(11);
var CsvDriver_1 = __webpack_require__(21);
var JsonDriver_1 = __webpack_require__(22);
function isEqualObj(a, b) {
    for (var key in a) {
        if (a[key] !== b[key]) {
            return false;
        }
    }
    return true;
}
exports.isEqualObj = isEqualObj;
function naturalCompare(a, b) {
    var ax = [];
    var bx = [];
    a.replace(/(\d+)|(\D+)/g, function (_, $1, $2) { ax.push([$1 || Infinity, $2 || ""]); });
    b.replace(/(\d+)|(\D+)/g, function (_, $1, $2) { bx.push([$1 || Infinity, $2 || ""]); });
    while (ax.length && bx.length) {
        var an = ax.shift();
        var bn = bx.shift();
        var nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
        if (nn) {
            return nn;
        }
    }
    return ax.length - bx.length;
}
exports.naturalCompare = naturalCompare;
function findByConf(item, conf) {
    if (typeof conf === "function") {
        if (conf.call(this, item)) {
            return item;
        }
    }
    else if (conf.by && conf.match) {
        if (item[conf.by] === conf.match) {
            return item;
        }
    }
}
exports.findByConf = findByConf;
function isDebug() {
    var dhx = window.dhx;
    if (typeof dhx !== "undefined") {
        return typeof (dhx.debug) !== "undefined" && dhx.debug;
    }
    // return typeof DHX_DEBUG_MODE !== "undefined" && DHX_DEBUG_MODE;
}
exports.isDebug = isDebug;
function dhxWarning(msg) {
    // tslint:disable-next-line:no-console
    console.warn(msg);
}
exports.dhxWarning = dhxWarning;
function dhxError(msg) {
    throw new Error(msg);
}
exports.dhxError = dhxError;
function toProxy(proxy) {
    var type = typeof proxy;
    if (type === "string") {
        return new dataproxy_1.DataProxy(proxy);
    }
    else if (type === "object") {
        return proxy;
    }
}
exports.toProxy = toProxy;
function toDataDriver(driver) {
    var type = typeof driver;
    if (type === "string") {
        switch (driver) {
            case "csv":
                return new CsvDriver_1.CsvDriver();
            case "json":
                return new JsonDriver_1.JsonDriver();
            default:
                // tslint:disable-next-line:no-console
                console.warn("incorrect driver type", driver);
                break;
        }
    }
    else if (typeof driver === "object") {
        return driver;
    }
}
exports.toDataDriver = toDataDriver;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(6));
__export(__webpack_require__(19));
__export(__webpack_require__(23));
__export(__webpack_require__(36));
__export(__webpack_require__(11));
__export(__webpack_require__(7));
__export(__webpack_require__(21));
__export(__webpack_require__(22));
__export(__webpack_require__(39));


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var EventSystem = /** @class */ (function () {
    function EventSystem(context) {
        this.events = {};
        this.context = context || this;
    }
    EventSystem.prototype.on = function (name, callback, context) {
        var event = name.toLowerCase();
        this.events[event] = this.events[event] || [];
        this.events[event].push({ callback: callback, context: context || this.context });
    };
    EventSystem.prototype.detach = function (name, context) {
        var event = name.toLowerCase();
        var eStack = this.events[event];
        if (context) {
            for (var i = eStack.length - 1; i >= 0; i--) {
                if (eStack[i].context === context) {
                    eStack.splice(i, 1);
                }
            }
        }
        else {
            this.events[event] = [];
        }
    };
    EventSystem.prototype.fire = function (name, args) {
        if (typeof args === "undefined") {
            args = [];
        }
        var event = name.toLowerCase();
        if (this.events[event]) {
            var res = this.events[event].map(function (e) { return e.callback.apply(e.context, args); });
            return res.indexOf(false) < 0;
        }
        return true;
    };
    return EventSystem;
}());
exports.EventSystem = EventSystem;
function EventsMixin(obj) {
    obj = obj || {};
    var eventSystem = new EventSystem(obj);
    obj.detachEvent = eventSystem.detach.bind(eventSystem);
    obj.attachEvent = eventSystem.on.bind(eventSystem);
    obj.callEvent = eventSystem.fire.bind(eventSystem);
}
exports.EventsMixin = EventsMixin;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global, setImmediate) {(function () {
  global = this

  var queueId = 1
  var queue = {}
  var isRunningTask = false

  if (!global.setImmediate)
    global.addEventListener('message', function (e) {
      if (e.source == global){
        if (isRunningTask)
          nextTick(queue[e.data])
        else {
          isRunningTask = true
          try {
            queue[e.data]()
          } catch (e) {}

          delete queue[e.data]
          isRunningTask = false
        }
      }
    })

  function nextTick(fn) {
    if (global.setImmediate) setImmediate(fn)
    // if inside of web worker
    else if (global.importScripts) setTimeout(fn)
    else {
      queueId++
      queue[queueId] = fn
      global.postMessage(queueId, '*')
    }
  }

  Deferred.resolve = function (value) {
    if (!(this._d == 1))
      throw TypeError()

    if (value instanceof Deferred)
      return value

    return new Deferred(function (resolve) {
        resolve(value)
    })
  }

  Deferred.reject = function (value) {
    if (!(this._d == 1))
      throw TypeError()

    return new Deferred(function (resolve, reject) {
        reject(value)
    })
  }

  Deferred.all = function (arr) {
    if (!(this._d == 1))
      throw TypeError()

    if (!(arr instanceof Array))
      return Deferred.reject(TypeError())

    var d = new Deferred()

    function done(e, v) {
      if (v)
        return d.resolve(v)

      if (e)
        return d.reject(e)

      var unresolved = arr.reduce(function (cnt, v) {
        if (v && v.then)
          return cnt + 1
        return cnt
      }, 0)

      if(unresolved == 0)
        d.resolve(arr)

      arr.map(function (v, i) {
        if (v && v.then)
          v.then(function (r) {
            arr[i] = r
            done()
            return r
          }, done)
      })
    }

    done()

    return d
  }

  Deferred.race = function (arr) {
    if (!(this._d == 1))
      throw TypeError()

    if (!(arr instanceof Array))
      return Deferred.reject(TypeError())

    if (arr.length == 0)
      return new Deferred()

    var d = new Deferred()

    function done(e, v) {
      if (v)
        return d.resolve(v)

      if (e)
        return d.reject(e)

      var unresolved = arr.reduce(function (cnt, v) {
        if (v && v.then)
          return cnt + 1
        return cnt
      }, 0)

      if(unresolved == 0)
        d.resolve(arr)

      arr.map(function (v, i) {
        if (v && v.then)
          v.then(function (r) {
            done(null, r)
          }, done)
      })
    }

    done()

    return d
  }

  Deferred._d = 1


  /**
   * @constructor
   */
  function Deferred(resolver) {
    'use strict'
    if (typeof resolver != 'function' && resolver != undefined)
      throw TypeError()

    if (typeof this != 'object' || (this && this.then))
      throw TypeError()

    // states
    // 0: pending
    // 1: resolving
    // 2: rejecting
    // 3: resolved
    // 4: rejected
    var self = this,
      state = 0,
      val = 0,
      next = [],
      fn, er;

    self['promise'] = self

    self['resolve'] = function (v) {
      fn = self.fn
      er = self.er
      if (!state) {
        val = v
        state = 1

        nextTick(fire)
      }
      return self
    }

    self['reject'] = function (v) {
      fn = self.fn
      er = self.er
      if (!state) {
        val = v
        state = 2

        nextTick(fire)

      }
      return self
    }

    self['_d'] = 1

    self['then'] = function (_fn, _er) {
      if (!(this._d == 1))
        throw TypeError()

      var d = new Deferred()

      d.fn = _fn
      d.er = _er
      if (state == 3) {
        d.resolve(val)
      }
      else if (state == 4) {
        d.reject(val)
      }
      else {
        next.push(d)
      }

      return d
    }

    self['catch'] = function (_er) {
      return self['then'](null, _er)
    }

    var finish = function (type) {
      state = type || 4
      next.map(function (p) {
        state == 3 && p.resolve(val) || p.reject(val)
      })
    }

    try {
      if (typeof resolver == 'function')
        resolver(self['resolve'], self['reject'])
    } catch (e) {
      self['reject'](e)
    }

    return self

    // ref : reference to 'then' function
    // cb, ec, cn : successCallback, failureCallback, notThennableCallback
    function thennable (ref, cb, ec, cn) {
      // Promises can be rejected with other promises, which should pass through
      if (state == 2) {
        return cn()
      }
      if ((typeof val == 'object' || typeof val == 'function') && typeof ref == 'function') {
        try {

          // cnt protects against abuse calls from spec checker
          var cnt = 0
          ref.call(val, function (v) {
            if (cnt++) return
            val = v
            cb()
          }, function (v) {
            if (cnt++) return
            val = v
            ec()
          })
        } catch (e) {
          val = e
          ec()
        }
      } else {
        cn()
      }
    };

    function fire() {

      // check if it's a thenable
      var ref;
      try {
        ref = val && val.then
      } catch (e) {
        val = e
        state = 2
        return fire()
      }

      thennable(ref, function () {
        state = 1
        fire()
      }, function () {
        state = 2
        fire()
      }, function () {
        try {
          if (state == 1 && typeof fn == 'function') {
            val = fn(val)
          }

          else if (state == 2 && typeof er == 'function') {
            val = er(val)
            state = 1
          }
        } catch (e) {
          val = e
          return finish()
        }

        if (val == self) {
          val = TypeError()
          finish()
        } else thennable(ref, function () {
            finish(3)
          }, finish, function () {
            finish(state == 1 && 3)
          })

      })
    }


  }

  // Export our library object, either for node.js or as a globally scoped variable
  if (true) {
    module['exports'] = Deferred
  } else {}
})()

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(20), __webpack_require__(32).setImmediate))

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Promise) {
Object.defineProperty(exports, "__esModule", { value: true });
var DataProxy = /** @class */ (function () {
    function DataProxy(url) {
        this.url = url;
    }
    DataProxy.prototype.load = function () {
        return this._ajax(this.url);
    };
    DataProxy.prototype.save = function (data, mode) {
        var modes = {
            insert: "POST",
            delete: "DELETE",
            update: "POST"
        };
        return this._ajax(this.url, data, modes[mode] || "POST");
    };
    DataProxy.prototype._ajax = function (url, data, method) {
        if (method === void 0) { method = "GET"; }
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response || xhr.responseText);
                }
                else {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText
                    });
                }
            };
            xhr.onerror = function () {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText
                });
            };
            xhr.open(method, url);
            xhr.setRequestHeader("Content-Type", "application/json");
            switch (method) {
                case "POST":
                case "DELETE":
                case "PUT":
                    xhr.send(JSON.stringify(data));
                    break;
                case "GET":
                    xhr.send();
                    break;
                default:
                    xhr.send();
                    break;
            }
        });
    };
    return DataProxy;
}());
exports.DataProxy = DataProxy;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(10)))

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = __webpack_require__(3);
var html_1 = __webpack_require__(1);
var View = /** @class */ (function () {
    function View(_container, config) {
        this._uid = core_1.uid();
        this.config = config || {};
    }
    View.prototype.mount = function (container, vnode) {
        if (vnode) {
            this._view = vnode;
        }
        if (container && this._view && this._view.mount) {
            // init view inside of HTML container
            this._container = html_1.toNode(container);
            if (this._container.tagName) {
                this._view.mount(this._container);
            }
            else if (this._container.attach) {
                this._container.attach(this);
            }
        }
    };
    View.prototype.getRootView = function () {
        return this._view;
    };
    View.prototype.paint = function () {
        if (this._view && ( // was mounted
        this._view.node || // already rendered node
            this._container || // not rendered, but has container
            !this._view.mount)) { // fake cell node
            this._doNotRepaint = false;
            this._view.redraw();
        }
    };
    return View;
}());
exports.View = View;


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function getRealPosition(node) {
    var rects = node.getBoundingClientRect();
    return {
        left: rects.left + window.pageXOffset,
        right: rects.right + window.pageXOffset,
        top: rects.top + window.pageYOffset,
        bottom: rects.bottom + window.pageYOffset
    };
}
exports.getRealPosition = getRealPosition;
function calculatePosition(pos, config) {
    var rightBorder = window.pageXOffset + window.innerWidth;
    var bottomBorder = window.pageYOffset + window.innerHeight;
    var style = {
        left: null,
        top: null,
        minWidth: config.width + "px",
        position: "absolute"
    };
    if (config.mode === "bottom") {
        if (pos.left + config.width > rightBorder) {
            style.left = pos.left - config.width + "px";
        }
        else {
            style.left = pos.left + "px";
        }
        if (pos.bottom + config.height > bottomBorder) {
            style.top = pos.top - config.height + "px";
        }
        else {
            style.top = pos.bottom + "px";
        }
    }
    else {
        if (pos.right + config.width > rightBorder) {
            style.left = pos.left - config.width + "px";
        }
        else {
            style.left = pos.right + "px";
        }
        if (pos.top + config.height > bottomBorder) {
            style.top = pos.bottom - config.height + "px";
        }
        else {
            style.top = pos.top + "px";
        }
    }
    return style;
}
exports.calculatePosition = calculatePosition;
function addInGroups(groups, item) {
    if (groups[item.group]) {
        if (item.active) {
            groups[item.group].active = item.id;
        }
        groups[item.group].elements.push(item.id);
    }
    else {
        groups[item.group] = {
            active: item.active ? item.id : null,
            elements: [item.id]
        };
    }
}
exports.addInGroups = addInGroups;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

exports.__esModule = true;
var locale = {
    dragAndDrop: "Drag & drop",
    or: "or",
    browse: "Browse files",
    filesOrFoldersHere: "files or folders here",
    cancel: "Cancel",
    clearAll: "Clear all",
    clear: "Clear",
    add: "Add",
    upload: "Upload",
    download: "Download",
    error: "error",
    byte: "B",
    kilobyte: "KB",
    megabyte: "MB",
    gigabyte: "GB"
};
exports["default"] = locale;


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = __webpack_require__(5);
var types_2 = __webpack_require__(5);
exports.DataEvents = types_2.DataEvents;
var FileStatus;
(function (FileStatus) {
    FileStatus["queue"] = "queue";
    FileStatus["uploaded"] = "uploaded";
    FileStatus["failed"] = "failed";
    FileStatus["inprogress"] = "inprogress";
})(FileStatus = exports.FileStatus || (exports.FileStatus = {}));
var UploaderEvents;
(function (UploaderEvents) {
    UploaderEvents["uploadBegin"] = "uploadbegin";
    UploaderEvents["beforeUploadFile"] = "beforeuploadfile";
    UploaderEvents["uploadFile"] = "uploadfile";
    UploaderEvents["uploadFail"] = "uploadfail";
    UploaderEvents["uploadComplete"] = "uploadcomplete";
    UploaderEvents["uploadProgress"] = "uploadprogress";
})(UploaderEvents = exports.UploaderEvents || (exports.UploaderEvents = {}));
var ProgressBarEvents;
(function (ProgressBarEvents) {
    ProgressBarEvents["cancel"] = "cancel";
})(ProgressBarEvents = exports.ProgressBarEvents || (exports.ProgressBarEvents = {}));
var VaultMode;
(function (VaultMode) {
    VaultMode["grid"] = "grid";
    VaultMode["list"] = "list";
})(VaultMode = exports.VaultMode || (exports.VaultMode = {}));


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(24));
__export(__webpack_require__(40));
__export(__webpack_require__(25));


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var button_1 = __webpack_require__(49);
var customHTMLButton_1 = __webpack_require__(50);
var dhx_button_1 = __webpack_require__(51);
var iconButton_1 = __webpack_require__(52);
var imageButton_1 = __webpack_require__(53);
var imageButtonText_1 = __webpack_require__(54);
var input_1 = __webpack_require__(55);
var menuItem_1 = __webpack_require__(56);
var separator_1 = __webpack_require__(57);
var spacer_1 = __webpack_require__(58);
var text_1 = __webpack_require__(59);
var types_1 = __webpack_require__(4);
function itemfactory(item, events) {
    if (item.$hidden) {
        return null;
    }
    switch (item.type) {
        case types_1.ItemType.button:
            return button_1.button(item);
        case types_1.ItemType.text:
            return text_1.text(item);
        case types_1.ItemType.separator:
            return separator_1.separator(item);
        case types_1.ItemType.spacer:
            return spacer_1.spacer(item);
        case types_1.ItemType.input:
            return input_1.input(item, events);
        case types_1.ItemType.imageButton:
            return imageButton_1.imageButton(item);
        case types_1.ItemType.iconButton:
            return iconButton_1.iconButton(item);
        case types_1.ItemType.selectButton:
        case types_1.ItemType.menuItem:
            return menuItem_1.menuItem(item);
        case types_1.ItemType.imageButtonText:
            return imageButtonText_1.imageButtonText(item);
        case types_1.ItemType.customHTMLButton:
            return customHTMLButton_1.customHTMLButton(item);
        case types_1.ItemType.dhxButton:
            return dhx_button_1.dhx_button(item);
        case types_1.ItemType.block:
        default:
            throw new Error("unknown item type");
    }
}
exports.itemfactory = itemfactory;
function createFactory(defaultType, forbiddenTypes) {
    if (forbiddenTypes === void 0) { forbiddenTypes = []; }
    var forbidden = {};
    forbiddenTypes.forEach(function (type) { return forbidden[type] = true; });
    return function (item, events) {
        item.type = item.type || defaultType;
        if (forbidden[item.type]) {
            item.type = defaultType;
        }
        return itemfactory(item, events);
    };
}
exports.createFactory = createFactory;


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = __webpack_require__(3);
var dom_1 = __webpack_require__(0);
var events_1 = __webpack_require__(9);
var hotkeys_1 = __webpack_require__(60);
var html_1 = __webpack_require__(1);
var view_1 = __webpack_require__(12);
var ts_data_1 = __webpack_require__(8);
var helper_1 = __webpack_require__(13);
var itemfactory_1 = __webpack_require__(17);
var types_1 = __webpack_require__(4);
var MenuBase = /** @class */ (function (_super) {
    __extends(MenuBase, _super);
    function MenuBase(element, config) {
        var _this = _super.call(this, element, core_1.extend({
            popupWidth: 175
        }, config)) || this;
        _this._isContextMenu = false;
        _this._documentHaveListener = false;
        _this.events = new events_1.EventSystem();
        _this.data = new ts_data_1.TreeCollection({}, _this.events);
        _this._documentClick = function (e) {
            if (html_1.locate(e, "dhx_widget_id") !== _this._uid && _this._documentHaveListener) {
                document.removeEventListener("click", _this._documentClick);
                _this._documentHaveListener = false;
                _this._close();
            }
        };
        _this._currentRoot = _this.data.getRoot();
        _this._factory = itemfactory_1.createFactory(types_1.ItemType.menuItem);
        _this._init();
        _this._initHandlers();
        _this._initEvents();
        return _this;
    }
    MenuBase.prototype.paint = function () {
        _super.prototype.paint.call(this);
        this._vpopups.redraw();
    };
    MenuBase.prototype.disable = function (ids) {
        this._setProp(ids, "$disabled", true);
    };
    MenuBase.prototype.enable = function (ids) {
        this._setProp(ids, "$disabled", false);
    };
    MenuBase.prototype.show = function (ids) {
        this._setProp(ids, "$hidden", false);
    };
    MenuBase.prototype.hide = function (ids) {
        this._setProp(ids, "$hidden", true);
    };
    MenuBase.prototype.destructor = function () {
        hotkeys_1.keyManager.removeHotKey(null, this);
    };
    MenuBase.prototype._close = function () {
        if (this.config.navigationType === types_1.NavigationType.click) {
            this._isActive = false;
        }
        clearTimeout(this._currentTimeout);
        this._activeMenu = null;
        this.paint();
    };
    MenuBase.prototype._init = function () {
        var _this = this;
        var render = function () { return dom_1.el("div", __assign({ dhx_widget_id: _this._uid, class: "menu-popups" + (_this._isContextMenu ? " context-menu" : "") }, _this._handlers), _this._drawPopups()); };
        this._vpopups = dom_1.create({
            render: render
        });
        this._vpopups.mount(document.body);
    };
    MenuBase.prototype._initHandlers = function () {
        var _this = this;
        /*
            for navigation type click:
            first click open menu, _isActive = true
            after navigation use mousemove
            can be closed after outer click or menu leaf item click
        */
        this._isActive = this.config.navigationType !== types_1.NavigationType.click;
        this._handlers = {
            onmousemove: function (e) {
                if (!_this._isActive) {
                    return;
                }
                var elem = html_1.locateNode(e);
                if (!elem) {
                    _this._activeItemChange(null);
                    return;
                }
                var id = elem.getAttribute("dhx_id");
                if (_this._activeMenu !== id) {
                    _this._activeMenu = id;
                    if (_this.data.haveChilds(id)) {
                        var position = helper_1.getRealPosition(elem);
                        _this.data.update(id, { $position: position }, false);
                    }
                    _this._activeItemChange(id);
                }
            },
            onmouseleave: function () {
                if (_this.config.navigationType !== types_1.NavigationType.click) { // maybe all time when mouse leave close menu
                    _this._activeItemChange(null);
                }
            },
            onclick: function (e) {
                var element = html_1.locateNode(e);
                if (!element) {
                    return;
                }
                var id = element.getAttribute("dhx_id");
                var item = _this.data.getItem(id);
                switch (item.type) {
                    case types_1.ItemType.selectButton:
                    case types_1.ItemType.menuItem:
                        if (id === _this._currentRoot) {
                            _this._close();
                            return;
                        }
                        if (!_this._isActive) {
                            _this._isActive = true;
                        }
                        _this._setRoot(id);
                        _this._activeMenu = id;
                        if (_this.data.haveChilds(id)) {
                            var position = helper_1.getRealPosition(element);
                            _this.data.update(id, { $position: position }, false);
                            _this._activeItemChange(id);
                        }
                        else {
                            _this._onMenuItemClick(id, e);
                        }
                        break;
                    case types_1.ItemType.dhxButton:
                    case types_1.ItemType.imageButtonText:
                    case types_1.ItemType.iconButton:
                    case types_1.ItemType.imageButton:
                    case types_1.ItemType.button:
                    case types_1.ItemType.customHTMLButton:
                        if (item.twoState) {
                            _this.data.update(item.id, { active: !item.active });
                        }
                        _this.events.fire(types_1.ToolbarEvents.click, [id, e]);
                    case types_1.ItemType.separator:
                    case types_1.ItemType.input:
                    case types_1.ItemType.text:
                    case types_1.ItemType.spacer:
                        _this._close();
                    default:
                        return;
                }
            }
        };
    };
    MenuBase.prototype._initEvents = function () {
        var _this = this;
        var timeout = null;
        this.data.events.on(types_1.DataEvents.change, function () {
            _this.paint();
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(function () {
                _this._normalizeData();
                _this._resetHotkeys();
                timeout = null;
                _this.paint();
            }, 100);
        });
        this.events.on(types_1.ToolbarEvents.click, function (id) {
            var item = _this.data.getItem(id);
            var parent = _this.data.getItem(item.parent);
            if (parent && parent.type === types_1.ItemType.selectButton) {
                _this.data.update(item.parent, { value: item.value, icon: item.icon });
            }
            if (item.group) {
                var group = _this._groups[item.group];
                if (group.active) {
                    _this.data.update(group.active, { active: false });
                }
                group.active = item.id;
                _this.data.update(item.id, { active: true });
            }
        });
    };
    MenuBase.prototype._drawPopups = function () {
        var _this = this;
        var id = this._activeMenu;
        if (!this._isContextMenu && !id) {
            return null;
        }
        var root = this._currentRoot;
        if (this._isContextMenu && !this._activePosition) {
            return null;
        }
        var parentIds = this._getParents(id, root);
        return parentIds.map(function (itemId) {
            if (!_this.data.haveChilds(itemId)) {
                return null;
            }
            var item = _this.data.getItem(itemId) || {}; // for root item
            var count = 0;
            var separators = 0;
            _this.data.eachChild(itemId, function (child) {
                if (child.$hidden) {
                    return;
                }
                if (child.type === "separator" || child.separator) {
                    separators++;
                }
                else {
                    count++;
                }
            }, false);
            var width = item.width || _this.config.popupWidth;
            var position = (_this._isContextMenu && _this._activePosition && itemId === root) ? _this._activePosition : item.$position;
            var mode = _this._getMode(item, root, position === _this._activePosition);
            var height = (position.bottom - position.top) * count + separators * 5; // separator 5px
            return dom_1.el("div", {
                class: "dhx_widget menu-popup",
                style: helper_1.calculatePosition(position, { mode: mode, width: width, height: height })
            }, _this._drawMenuItems(itemId));
        }).reverse();
    };
    MenuBase.prototype._onMenuItemClick = function (id, e) {
        var item = this.data.getItem(id);
        if (item.$disabled) {
            return;
        }
        this.events.fire(types_1.ToolbarEvents.click, [id, e]);
        this._close();
    };
    MenuBase.prototype._activeItemChange = function (id) {
        var _this = this;
        if (id && !this._documentHaveListener) {
            this._listenOuterClick();
        }
        if (id && this.data.haveChilds(id)) {
            this._activeMenu = id;
            clearTimeout(this._currentTimeout);
            this.paint();
        }
        else {
            this._activeMenu = id;
            clearTimeout(this._currentTimeout);
            this._currentTimeout = setTimeout(function () { return _this.paint(); }, 400);
        }
    };
    MenuBase.prototype._resetHotkeys = function () {
        var _this = this;
        hotkeys_1.keyManager.removeHotKey(null, this);
        this.data.map(function (item) {
            if (item.hotkey) {
                hotkeys_1.keyManager.addHotKey(item.hotkey, function () { return _this._onMenuItemClick(item.id, null); }, _this);
            }
        });
    };
    MenuBase.prototype._listenOuterClick = function () {
        document.addEventListener("click", this._documentClick);
        this._documentHaveListener = true;
    };
    MenuBase.prototype._getMode = function (item, root, _active) {
        if (_active === void 0) { _active = false; }
        return item.parent === root ? "bottom" : "right";
    };
    MenuBase.prototype._drawMenuItems = function (id) {
        var _this = this;
        return this.data.map(function (item) { return _this._factory(item, _this.events); }, id, false);
    };
    MenuBase.prototype._normalizeData = function () {
        var _this = this;
        var root = this.data.getRoot();
        var groups = {};
        this.data.eachChild(root, function (item) {
            if (_this.data.haveChilds(item.id) && item.parent !== _this.data.getRoot()) {
                item.$openIcon = "right";
            }
            if (item.group) {
                helper_1.addInGroups(groups, item);
            }
        }, true);
        this._groups = groups;
    };
    MenuBase.prototype._setRoot = function (_id) {
        return; // need only for toolbar
    };
    MenuBase.prototype._getParents = function (id, root) {
        var parentIds = [];
        var afterRoot = false;
        var currentItem = this.data.getItem(id);
        var disabled = currentItem && currentItem.$disabled;
        this.data.eachParent(id, function (item) {
            if (item.id === root) {
                parentIds.push(item.id);
                afterRoot = true;
            }
            else if (!afterRoot) {
                parentIds.push(item.id);
            }
        }, !disabled);
        if (this._isContextMenu && this._activePosition) {
            parentIds.push(root);
        }
        return parentIds;
    };
    MenuBase.prototype._setProp = function (id, key, value) {
        var _this = this;
        var _a;
        if (Array.isArray(id)) {
            id.forEach(function (itemId) {
                var _a;
                return _this.data.update(itemId, (_a = {}, _a[key] = value, _a));
            });
        }
        else {
            this.data.update(id, (_a = {}, _a[key] = value, _a));
        }
    };
    return MenuBase;
}(view_1.View));
exports.MenuBase = MenuBase;


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = __webpack_require__(9);
var loader_1 = __webpack_require__(31);
var sort_1 = __webpack_require__(35);
var dataproxy_1 = __webpack_require__(11);
var helpers_1 = __webpack_require__(7);
var types_1 = __webpack_require__(6);
var core_1 = __webpack_require__(3);
var DataCollection = /** @class */ (function () {
    function DataCollection(config, events) {
        this._order = [];
        this._pull = {};
        this._changes = {
            order: []
        };
        this._initOrder = null;
        this.config = config || {};
        this._sort = new sort_1.Sort();
        this._loader = new loader_1.Loader(this, this._changes);
        this.events = events || new events_1.EventSystem(this);
    }
    DataCollection.prototype.add = function (obj, index) {
        if (!this.events.fire(types_1.DataEvents.beforeAdd, [obj])) {
            return;
        }
        this._addCore(obj, index);
        this._onChange("add", obj.id, obj);
        this.events.fire(types_1.DataEvents.afterAdd, [obj]);
    };
    DataCollection.prototype.remove = function (id) {
        var obj = this._pull[id];
        if (obj) {
            if (!this.events.fire(types_1.DataEvents.beforeRemove, [obj])) {
                return;
            }
            this._removeCore(obj.id);
            this._onChange("remove", id, obj);
        }
        this.events.fire(types_1.DataEvents.afterRemove, [obj]);
    };
    DataCollection.prototype.removeAll = function () {
        this._removeAll();
        this.events.fire(types_1.DataEvents.removeAll);
        this.events.fire(types_1.DataEvents.change);
    };
    DataCollection.prototype.exists = function (id) {
        return !!this._pull[id];
    };
    DataCollection.prototype.getNearId = function (id) {
        var item = this._pull[id];
        if (!item) {
            return this._order[0].id || "";
        }
    };
    DataCollection.prototype.getItem = function (id) {
        return this._pull[id];
    };
    DataCollection.prototype.update = function (id, obj, silent) {
        var item = this.getItem(id);
        if (item) {
            if (helpers_1.isEqualObj(obj, item)) {
                return;
            }
            if (obj.id && id !== obj.id) {
                helpers_1.dhxWarning("this method doesn't allow change id");
                if (helpers_1.isDebug()) {
                    // tslint:disable-next-line:no-debugger
                    debugger;
                }
            }
            else {
                core_1.extend(this._pull[id], obj, false);
                if (this.config.update) {
                    this.config.update(this._pull[id]);
                }
                if (!silent) {
                    this._onChange("update", id, this._pull[id]);
                }
            }
        }
        else {
            helpers_1.dhxWarning("item not found");
        }
    };
    DataCollection.prototype.getIndex = function (id) {
        var res = core_1.findIndex(this._order, function (item) { return item.id === id; });
        if (this._pull[id] && res >= 0) {
            return res;
        }
        return -1;
    };
    DataCollection.prototype.getId = function (index) {
        if (!this._order[index]) {
            return;
        }
        return this._order[index].id;
    };
    DataCollection.prototype.getLength = function () {
        return this._order.length;
    };
    DataCollection.prototype.filter = function (rule, config) {
        var _this = this;
        config = core_1.extend({
            add: false,
            multiple: true
        }, config);
        if (!config.add) {
            this._order = this._initOrder || this._order;
            this._initOrder = null;
        }
        this._filters = this._filters || {};
        if (!config.multiple || !rule) {
            this._filters = {};
        }
        if (rule) {
            if (typeof rule === "function") {
                var f = "_";
                this._filters[f] = {
                    match: f,
                    compare: rule
                };
            }
            else {
                if (!rule.match) {
                    delete this._filters[rule.by];
                }
                else {
                    rule.compare = rule.compare || (function (val, match) { return val === match; });
                    this._filters[rule.by] = rule;
                }
            }
            var fOrder = this._order.filter(function (item) {
                return Object.keys(_this._filters).every(function (key) {
                    return item[key] ?
                        _this._filters[key].compare(item[key], _this._filters[key].match, item)
                        : _this._filters[key].compare(item);
                });
            });
            if (!this._initOrder) {
                this._initOrder = this._order;
                this._order = fOrder;
            }
        }
        this.events.fire(types_1.DataEvents.change);
    };
    DataCollection.prototype.find = function (conf) {
        for (var key in this._pull) {
            var res = helpers_1.findByConf(this._pull[key], conf);
            if (res) {
                return res;
            }
        }
        return null;
    };
    DataCollection.prototype.findAll = function (conf) {
        var res = [];
        for (var key in this._pull) {
            var item = helpers_1.findByConf(this._pull[key], conf);
            if (item) {
                res.push(item);
            }
        }
        return res;
    };
    DataCollection.prototype.sort = function (by) {
        this._sort.sort(this._order, by);
        if (this._initOrder && this._initOrder.length) {
            this._sort.sort(this._initOrder, by);
        }
        this.events.fire(types_1.DataEvents.change);
    };
    DataCollection.prototype.copy = function (id, index, target, targetId) {
        if (!this.exists(id)) {
            return null;
        }
        var newid = core_1.uid();
        if (target) {
            if (targetId) {
                target.add(__assign({}, this.getItem(id)), index, targetId);
                return;
            }
            if (target.exists(id)) {
                target.add(__assign({}, this.getItem(id), { id: newid }), index);
                return newid;
            }
            else {
                target.add(this.getItem(id), index);
                return id;
            }
        }
        this.add(__assign({}, this.getItem(id), { id: newid }), index);
        return newid;
    };
    DataCollection.prototype.move = function (id, index, target, targetId) {
        if (target && target !== this && this.exists(id)) {
            var item = this.getItem(id);
            if (target.exists(id)) {
                item.id = core_1.uid();
            }
            if (targetId) {
                item.parent = targetId;
            }
            target.add(item, index);
            // remove data from original collection
            this.remove(item.id);
            return item.id;
        }
        if (this.getIndex(id) === index) {
            return null;
        }
        // move other elements
        var spliced = this._order.splice(this.getIndex(id), 1)[0];
        if (index === -1) {
            index = this._order.length;
        }
        this._order.splice(index, 0, spliced);
        this.events.fire(types_1.DataEvents.change); // if target not this, it trigger add and remove
        return id;
    };
    DataCollection.prototype.load = function (url, driver) {
        if (typeof url === "string") {
            url = new dataproxy_1.DataProxy(url);
        }
        return this._loader.load(url, driver);
    };
    DataCollection.prototype.parse = function (data, driver) {
        this._removeAll();
        return this._loader.parse(data, driver);
    };
    DataCollection.prototype.$parse = function (data) {
        var apx = this.config.approximate;
        if (apx) {
            data = this._approximate(data, apx.value, apx.maxNum);
        }
        this._parse_data(data);
        this.events.fire(types_1.DataEvents.change);
        this.events.fire(types_1.DataEvents.load);
    };
    DataCollection.prototype.save = function (url) {
        this._loader.save(url);
    };
    // todo: loop through the array and check saved statuses
    DataCollection.prototype.isSaved = function () {
        return !this._changes.order.length; // todo: bad solution, errors and holded elments are missed...
    };
    DataCollection.prototype.map = function (cb) {
        var result = [];
        for (var i = 0; i < this._order.length; i++) {
            result.push(cb.call(this, this._order[i], i));
        }
        return result;
    };
    DataCollection.prototype.reduce = function (cb, acc) {
        for (var i = 0; i < this._order.length; i++) {
            acc = cb.call(this, acc, this._order[i], i);
        }
        return acc;
    };
    DataCollection.prototype.serialize = function () {
        return this.map(function (item) {
            var newItem = __assign({}, item);
            Object.keys(newItem).forEach(function (key) {
                if (key[0] === "$") {
                    delete newItem[key];
                }
            });
            return newItem;
        });
    };
    DataCollection.prototype.getInitialData = function () {
        return this._initOrder;
    };
    DataCollection.prototype._removeAll = function () {
        this._pull = {};
        this._order = [];
        this._changes.order = [];
        this._initOrder = null;
    };
    DataCollection.prototype._addCore = function (obj, index) {
        if (this.config.init) {
            obj = this.config.init(obj);
        }
        obj.id = obj.id ? obj.id.toString() : core_1.uid();
        if (this._pull[obj.id]) {
            helpers_1.dhxError("Item already exist");
        }
        // todo: not ideal solution
        if (this._initOrder && this._initOrder.length) {
            this._addToOrder(this._initOrder, obj, index);
        }
        this._addToOrder(this._order, obj, index);
    };
    DataCollection.prototype._removeCore = function (id) {
        if (this.getIndex(id) >= 0) {
            this._order = this._order.filter(function (el) { return el.id !== id; });
            delete this._pull[id];
        }
        if (this._initOrder && this._initOrder.length) {
            this._initOrder = this._initOrder.filter(function (el) { return el.id !== id; });
        }
    };
    DataCollection.prototype._parse_data = function (data) {
        var index = this._order.length;
        if (this.config.prep) {
            data = this.config.prep(data);
        }
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var obj = data_1[_i];
            if (this.config.init) {
                obj = this.config.init(obj);
            }
            obj.id = obj.id || core_1.uid();
            this._pull[obj.id] = obj;
            this._order[index++] = obj;
        }
    };
    DataCollection.prototype._approximate = function (data, values, maxNum) {
        var len = data.length;
        var vlen = values.length;
        var rlen = Math.floor(len / maxNum);
        var newData = Array(Math.ceil(len / rlen));
        var index = 0;
        for (var i = 0; i < len; i += rlen) {
            var newItem = core_1.copy(data[i]);
            var end = Math.min(len, i + rlen);
            for (var j = 0; j < vlen; j++) {
                var sum = 0;
                for (var z = i; z < end; z++) {
                    sum += data[z][values[j]];
                }
                newItem[values[j]] = sum / (end - i);
            }
            newData[index++] = newItem;
        }
        return newData;
    };
    DataCollection.prototype._onChange = function (status, id, obj) {
        for (var _i = 0, _a = this._changes.order; _i < _a.length; _i++) {
            var item = _a[_i];
            // update pending item if previous state is "saving" or if item not saved yet
            if (item.id === id && !item.saving) {
                // update item
                if (item.error) {
                    item.error = false;
                }
                item = __assign({}, item, { obj: obj, status: status });
                this.events.fire(types_1.DataEvents.change, [id, status, obj]);
                return;
            }
        }
        this._changes.order.push({ id: id, status: status, obj: __assign({}, obj), saving: false });
        this.events.fire(types_1.DataEvents.change, [id, status, obj]);
    };
    DataCollection.prototype._addToOrder = function (array, obj, index) {
        if (index >= 0 && array[index]) {
            this._pull[obj.id] = obj;
            array.splice(index, 0, obj);
        }
        else {
            this._pull[obj.id] = obj;
            array.push(obj);
        }
    };
    return DataCollection;
}());
exports.DataCollection = DataCollection;


/***/ }),
/* 20 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1, eval)("this");
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var CsvDriver = /** @class */ (function () {
    function CsvDriver(config) {
        if (config === void 0) { config = {}; }
        var initConfig = {
            skipHeader: 0,
            nameByHeader: false,
            row: "\n",
            column: ",",
        };
        this.config = __assign({}, initConfig, config);
        if (this.config.nameByHeader) {
            this.config.skipHeader = 1;
        }
    }
    CsvDriver.prototype.getFields = function (row, headers) {
        var parts = row.trim().split(this.config.column);
        var obj = {};
        for (var i = 0; i < parts.length; i++) {
            obj[headers ? headers[i] : i + 1] = parts[i];
        }
        return obj;
    };
    CsvDriver.prototype.getRows = function (data) {
        return data.trim().split(this.config.row);
    };
    CsvDriver.prototype.toJsonArray = function (data) {
        var _this = this;
        var rows = this.getRows(data);
        var names = this.config.names;
        if (this.config.skipHeader) {
            var top_1 = rows.splice(0, this.config.skipHeader);
            if (this.config.nameByHeader) {
                names = top_1[0].trim().split(this.config.column);
            }
        }
        return rows.map(function (row) { return _this.getFields(row, names); });
    };
    return CsvDriver;
}());
exports.CsvDriver = CsvDriver;


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var JsonDriver = /** @class */ (function () {
    function JsonDriver() {
    }
    JsonDriver.prototype.toJsonArray = function (data) {
        return this.getRows(data);
    };
    JsonDriver.prototype.getFields = function (row) {
        return row;
    };
    JsonDriver.prototype.getRows = function (data) {
        return typeof data === "string" ? JSON.parse(data) : data;
    };
    return JsonDriver;
}());
exports.JsonDriver = JsonDriver;


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = __webpack_require__(3);
var datacollection_1 = __webpack_require__(19);
var dataproxy_1 = __webpack_require__(11);
var helpers_1 = __webpack_require__(7);
var types_1 = __webpack_require__(6);
function addToOrder(store, obj, parent, index) {
    if (index !== undefined && index !== -1 && store[parent] && store[parent][index]) {
        store[parent].splice(index, 0, obj);
    }
    else {
        if (!store[parent]) {
            store[parent] = [];
        }
        store[parent].push(obj);
    }
}
var TreeCollection = /** @class */ (function (_super) {
    __extends(TreeCollection, _super);
    function TreeCollection(config, events) {
        var _a;
        var _this = _super.call(this, config, events) || this;
        var root = _this._root = "_ROOT_" + core_1.uid();
        _this._childs = (_a = {}, _a[root] = [], _a);
        _this._initChilds = null;
        return _this;
    }
    TreeCollection.prototype.add = function (obj, index, parent) {
        if (index === void 0) { index = -1; }
        if (parent === void 0) { parent = this._root; }
        if (typeof obj !== "object") {
            obj = {
                value: obj
            };
        }
        obj.parent = obj.parent ? obj.parent.toString() : parent;
        _super.prototype.add.call(this, obj, index);
    };
    TreeCollection.prototype.getRoot = function () {
        return this._root;
    };
    TreeCollection.prototype.getParent = function (id, asObj) {
        if (asObj === void 0) { asObj = false; }
        if (!this._pull[id]) {
            return null;
        }
        var parent = this._pull[id].parent;
        return asObj ? this._pull[parent] : parent;
    };
    TreeCollection.prototype.getChilds = function (id) {
        if (this._childs && this._childs[id]) {
            return this._childs[id];
        }
        return [];
    };
    TreeCollection.prototype.getLength = function (id) {
        if (id === void 0) { id = this._root; }
        if (!this._childs[id]) {
            return null;
        }
        return this._childs[id].length;
    };
    TreeCollection.prototype.removeAll = function (id) {
        var _a;
        if (id) {
            var childs = this._childs[id].slice();
            for (var _i = 0, childs_1 = childs; _i < childs_1.length; _i++) {
                var child = childs_1[_i];
                this.remove(child.id);
            }
        }
        else {
            _super.prototype.removeAll.call(this);
            var root = this._root;
            this._initChilds = null;
            this._childs = (_a = {}, _a[root] = [], _a);
        }
    };
    TreeCollection.prototype.getIndex = function (id) {
        var parent = this.getParent(id);
        if (!parent || !this._childs[parent]) {
            return -1;
        }
        return core_1.findIndex(this._childs[parent], function (item) { return item.id === id; });
    };
    TreeCollection.prototype.sort = function (conf) {
        var childs = this._childs;
        for (var key in childs) {
            this._sort.sort(childs[key], conf);
        }
        this.events.fire(types_1.DataEvents.change);
    };
    TreeCollection.prototype.map = function (cb, parent, direct) {
        if (parent === void 0) { parent = this._root; }
        if (direct === void 0) { direct = true; }
        var result = [];
        if (!this.haveChilds(parent)) {
            return result;
        }
        for (var i = 0; i < this._childs[parent].length; i++) {
            result.push(cb.call(this, this._childs[parent][i], i));
            if (direct) {
                var childResult = this.map(cb, this._childs[parent][i].id, direct);
                result = result.concat(childResult);
            }
        }
        return result;
    };
    TreeCollection.prototype.filter = function (conf) {
        if (!conf) {
            this.restoreOrder();
            return;
        }
        if (!this._initChilds) {
            this._initChilds = this._childs;
        }
        conf.type = conf.type || types_1.TreeFilterType.all;
        var newChilds = {};
        this._recursiveFilter(conf, this._root, 0, newChilds);
        this._childs = newChilds;
        this.events.fire(types_1.DataEvents.change);
    };
    TreeCollection.prototype.restoreOrder = function () {
        if (this._initChilds) {
            this._childs = this._initChilds;
            this._initChilds = null;
        }
        this.events.fire(types_1.DataEvents.change);
    };
    TreeCollection.prototype.copy = function (id, index, target, targetId) {
        if (target === void 0) { target = this; }
        if (targetId === void 0) { targetId = this._root; }
        if (!this.exists(id)) {
            return null;
        }
        var childs = __assign({}, this._childs);
        var currentChilds = childs[id];
        if (target === this && !this.canCopy(id, targetId)) {
            return null;
        }
        if (!(target instanceof TreeCollection)) { // copy to datacollection
            target.add(this._pull[id]);
            return;
        }
        if (this.exists(id)) {
            var item = __assign({}, this.getItem(id));
            if (target.exists(id)) {
                item.id = core_1.uid();
            }
            else {
                item.id = id;
            }
            item.parent = targetId;
            target.add(item, index);
            id = item.id;
        }
        if (currentChilds) {
            for (var _i = 0, currentChilds_1 = currentChilds; _i < currentChilds_1.length; _i++) {
                var child = currentChilds_1[_i];
                var childId = child.id;
                var childIndex = this.getIndex(childId);
                this.copy(childId, childIndex, target, id);
            }
        }
        return id;
    };
    TreeCollection.prototype.move = function (id, index, target, targetId) {
        if (target === void 0) { target = this; }
        if (targetId === void 0) { targetId = this._root; }
        if (!this.exists(id)) {
            return null;
        }
        if (target !== this) {
            if (!(target instanceof TreeCollection)) { // move to datacollection
                target.add(this._pull[id]);
                this.remove(id);
                return;
            }
            var returnId = this.copy(id, index, target, targetId);
            this.remove(id);
            return returnId;
        }
        // move inside
        if (!this.canCopy(id, targetId)) {
            return null;
        }
        var parent = this.getParent(id);
        var parentIndex = this.getIndex(id);
        // get item from parent array and move to target array
        var spliced = this._childs[parent].splice(parentIndex, 1)[0];
        spliced.parent = targetId; // need for next moving, ... not best solution, may be full method for get item
        if (!this._childs[parent].length) {
            delete this._childs[parent];
        }
        if (!this.haveChilds(targetId)) {
            this._childs[targetId] = [];
        }
        if (index === -1) {
            index = this._childs[targetId].push(spliced);
        }
        else {
            this._childs[targetId].splice(index, 0, spliced);
        }
        this.events.fire(types_1.DataEvents.change);
        return id;
    };
    TreeCollection.prototype.eachChild = function (id, cb, direct) {
        if (direct === void 0) { direct = true; }
        if (!this.haveChilds(id)) {
            return;
        }
        for (var i = 0; i < this._childs[id].length; i++) {
            cb.call(this, this._childs[id][i], i);
            if (direct && this.getItem(this._childs[id][i].id).$opened !== false) {
                this.eachChild(this._childs[id][i].id, cb, direct);
            }
        }
    };
    TreeCollection.prototype.getNearId = function (id) {
        return id; // for selection
    };
    TreeCollection.prototype.loadChilds = function (id, driver) {
        var _this = this;
        if (driver === void 0) { driver = "json"; }
        var url = this.config.autoload + "?id=" + id;
        var proxy = new dataproxy_1.DataProxy(url);
        proxy.load().then(function (data) {
            driver = helpers_1.toDataDriver(driver);
            data = driver.toJsonArray(data);
            _this._parse_data(data, id);
            _this.events.fire(types_1.DataEvents.change);
        });
    };
    TreeCollection.prototype.refreshChilds = function (id, driver) {
        if (driver === void 0) { driver = "json"; }
        this.removeAll(id);
        this.loadChilds(id, driver);
    };
    TreeCollection.prototype.eachParent = function (id, cb, self) {
        if (self === void 0) { self = false; }
        var item = this.getItem(id);
        if (!item) {
            return;
        }
        if (self) {
            cb.call(this, item);
        }
        if (item.parent === this._root) {
            return;
        }
        var parent = this.getItem(item.parent);
        cb.call(this, parent);
        this.eachParent(item.parent, cb);
    };
    TreeCollection.prototype.haveChilds = function (id) {
        return id in this._childs;
    };
    TreeCollection.prototype.canCopy = function (id, target) {
        if (id === target) {
            return false;
        }
        var canCopy = true;
        this.eachParent(target, function (item) { return item.id === id ? canCopy = false : null; }); // locate return string
        return canCopy;
    };
    TreeCollection.prototype.serialize = function (fn) {
        return this._serialize(this._root, fn);
    };
    TreeCollection.prototype.getId = function (index, parent) {
        if (parent === void 0) { parent = this._root; }
        if (!this._childs[parent] || !this._childs[parent][index]) {
            return;
        }
        return this._childs[parent][index].id;
    };
    TreeCollection.prototype._removeAll = function (id) {
        var _a;
        if (id) {
            var childs = this._childs[id].slice();
            for (var _i = 0, childs_2 = childs; _i < childs_2.length; _i++) {
                var child = childs_2[_i];
                this.remove(child.id);
            }
        }
        else {
            _super.prototype._removeAll.call(this);
            var root = this._root;
            this._initChilds = null;
            this._childs = (_a = {}, _a[root] = [], _a);
        }
    };
    TreeCollection.prototype._removeCore = function (id) {
        if (this._pull[id]) {
            var parent_1 = this.getParent(id);
            this._childs[parent_1] = this._childs[parent_1].filter(function (item) { return item.id !== id; });
            if (parent_1 !== this._root && !this._childs[parent_1].length) {
                delete this._childs[parent_1];
            }
            if (this._initChilds && this._initChilds[parent_1]) {
                this._initChilds[parent_1] = this._initChilds[parent_1].filter(function (item) { return item.id !== id; });
                if (parent_1 !== this._root && !this._initChilds[parent_1].length) {
                    delete this._initChilds[parent_1];
                }
            }
            this._fastDeleteChilds(this._childs, id);
            if (this._initChilds) {
                this._fastDeleteChilds(this._initChilds, id);
            }
        }
    };
    TreeCollection.prototype._addToOrder = function (_order, obj, index) {
        var childs = this._childs;
        var initChilds = this._initChilds;
        var parent = obj.parent;
        this._pull[obj.id] = obj;
        addToOrder(childs, obj, parent, index);
        if (initChilds) {
            addToOrder(initChilds, obj, parent, index);
        }
    };
    TreeCollection.prototype._parse_data = function (data, parent) {
        if (parent === void 0) { parent = this._root; }
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var obj = data_1[_i];
            if (this.config.init) {
                obj = this.config.init(obj);
            }
            if (typeof obj !== "object") {
                obj = {
                    value: obj
                };
            }
            obj.id = obj.id ? obj.id.toString() : core_1.uid();
            obj.parent = obj.parent ? obj.parent.toString() : parent;
            this._pull[obj.id] = obj;
            if (!this._childs[obj.parent]) {
                this._childs[obj.parent] = [];
            }
            this._childs[obj.parent].push(obj);
            if (obj.childs && obj.childs instanceof Object) {
                this._parse_data(obj.childs, obj.id);
            }
        }
    };
    TreeCollection.prototype._fastDeleteChilds = function (target, id) {
        if (this._pull[id]) {
            delete this._pull[id];
        }
        if (!target[id]) {
            return;
        }
        for (var i = 0; i < target[id].length; i++) {
            this._fastDeleteChilds(target, target[id][i].id);
        }
        delete target[id];
    };
    TreeCollection.prototype._recursiveFilter = function (conf, current, level, newChilds) {
        var _this = this;
        var childs = this._childs[current];
        if (!childs) {
            return;
        }
        var condition = function (item) {
            switch (conf.type) {
                case types_1.TreeFilterType.all: {
                    return true;
                }
                case types_1.TreeFilterType.specific: {
                    return level === conf.specific;
                }
                case types_1.TreeFilterType.leafs: {
                    return !_this.haveChilds(item.id);
                }
            }
        };
        if (conf.by && conf.match) {
            var customRule = function (item) { return !condition(item) || item[conf.by].toString().toLowerCase().indexOf(conf.match.toString().toLowerCase()) !== -1; };
            newChilds[current] = childs.filter(customRule);
        }
        else if (conf.rule && typeof conf.rule === "function") {
            var customRule = function (item) { return !condition(item) || conf.rule(item); };
            var filtered = childs.filter(customRule);
            if (filtered.length) {
                newChilds[current] = filtered;
            }
        }
        for (var _i = 0, childs_3 = childs; _i < childs_3.length; _i++) {
            var child = childs_3[_i];
            this._recursiveFilter(conf, child.id, level + 1, newChilds);
        }
    };
    TreeCollection.prototype._serialize = function (parent, fn) {
        var _this = this;
        if (parent === void 0) { parent = this._root; }
        return this.map(function (item) {
            var itemCopy = {};
            for (var key in item) {
                if (key === "parent" || key === "childs") {
                    continue;
                }
                itemCopy[key] = item[key];
            }
            if (fn) {
                itemCopy = fn(itemCopy);
            }
            if (_this.haveChilds(item.id)) {
                itemCopy.childs = _this._serialize(item.id, fn);
            }
            return itemCopy;
        }, parent, false);
    };
    return TreeCollection;
}(datacollection_1.DataCollection));
exports.TreeCollection = TreeCollection;


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var html_1 = __webpack_require__(1);
var tooltip_1 = __webpack_require__(25);
var Position;
(function (Position) {
    Position["right"] = "right";
    Position["bottom"] = "bottom";
    Position["center"] = "center";
})(Position = exports.Position || (exports.Position = {}));
var nodeTimeout = new WeakMap();
var messageStack = [];
var messageContainer = document.createElement("div");
messageContainer.className = "dhx-message-container";
function onExpire(node, fromClick) {
    if (fromClick) {
        clearTimeout(nodeTimeout.get(node));
    }
    var index = messageStack.indexOf(node);
    if (index < 0) { // node in body
        document.body.removeChild(node);
        return;
    }
    messageContainer.removeChild(node);
    messageStack.splice(index, 1);
    if (messageStack.length === 0) {
        document.body.removeChild(messageContainer);
    }
}
function message(props) {
    if (typeof props === "string") {
        props = { text: props };
    }
    var messageBox = document.createElement("div");
    messageBox.className = "dhx-message " + (props.css || "");
    messageBox.innerHTML = "<span class=\"message-text\">" + props.text + "</span> <div class=\"dxi " + props.icon + "\"></div>";
    if (props.at) {
        messageBox.style.position = "absolute";
        var _a = props.at, node = _a.node, position = _a.position;
        var elem = html_1.toNode(node);
        var rects = elem.getBoundingClientRect();
        document.body.appendChild(messageBox); // for calc bounings
        var _b = messageBox.getBoundingClientRect(), width = _b.width, height = _b.height;
        var _c = tooltip_1.findPosition(rects, position, width, height), left = _c.left, top_1 = _c.top, pos = _c.pos;
        messageBox.className += " " + pos;
        messageBox.style.left = left + "px";
        messageBox.style.top = top_1 + "px";
    }
    else {
        if (messageStack.length === 0) {
            document.body.appendChild(messageContainer);
        }
        messageStack.push(messageBox);
        messageContainer.appendChild(messageBox);
    }
    if (props.expire) {
        var timeout = setTimeout(function () { return onExpire(messageBox); }, props.expire);
        nodeTimeout.set(messageBox, timeout);
    }
    messageBox.onclick = function () { return onExpire(messageBox, true); };
}
exports.message = message;


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var html_1 = __webpack_require__(1);
var message_1 = __webpack_require__(24);
var RealPosition;
(function (RealPosition) {
    RealPosition["left"] = "left";
    RealPosition["right"] = "right";
    RealPosition["top"] = "top";
    RealPosition["bottom"] = "bottom";
    RealPosition["center"] = "center";
})(RealPosition = exports.RealPosition || (exports.RealPosition = {}));
function findPosition(targetRect, position, width, height) {
    var margin = 8; // margin top/bot, left/right
    var pos;
    var left;
    var top;
    switch (position) {
        case message_1.Position.center:
            left = targetRect.left + window.pageXOffset + (targetRect.width - width) / 2;
            if (left + margin < window.pageXOffset) {
                left = targetRect.left + window.pageXOffset;
            }
            top = targetRect.top + window.pageYOffset + (targetRect.height - height) / 2;
            pos = RealPosition.center;
            return { left: left, top: top, pos: pos };
        case message_1.Position.right:
            pos = RealPosition.right;
            left = targetRect.right + window.pageXOffset;
            if (left + width + margin > window.innerWidth + window.pageXOffset) { // set left
                left = window.pageXOffset + targetRect.left - width;
                pos = RealPosition.left;
            }
            top = window.pageYOffset + targetRect.top + (targetRect.height - height) / 2;
            return { left: left, top: top, pos: pos };
        case message_1.Position.bottom:
            left = window.pageXOffset + targetRect.left + (targetRect.width - width) / 2;
            if (left < window.pageXOffset) {
                left = window.pageXOffset + targetRect.left;
            }
            pos = RealPosition.bottom;
            top = window.pageYOffset + targetRect.bottom;
            if (top + height + margin > window.innerHeight + window.pageYOffset) { // set top
                top = window.pageYOffset + targetRect.top - height;
                pos = RealPosition.top;
            }
            return { left: left, top: top, pos: pos };
    }
}
exports.findPosition = findPosition;
// tooltip init
var tooltipBox = document.createElement("div");
var tooltipText = document.createElement("span");
tooltipText.className = "tooltip-text";
tooltipBox.appendChild(tooltipText);
tooltipBox.style.position = "absolute";
var timeoutId = null;
var lastNode = null;
var isActive = false;
var hideTimeout = null;
function showTooltip(node, text, position, css, force) {
    if (force === void 0) { force = false; }
    var rects = node.getBoundingClientRect();
    tooltipText.textContent = text;
    document.body.appendChild(tooltipBox);
    tooltipBox.className = "dhx-tooltip" + (force ? " forced" : "");
    var _a = tooltipBox.getBoundingClientRect(), width = _a.width, height = _a.height;
    var _b = findPosition(rects, position, width, height), left = _b.left, top = _b.top, pos = _b.pos;
    switch (pos) {
        case RealPosition.bottom:
            tooltipBox.style.left = left + "px";
            tooltipBox.style.top = top + "px";
            break;
        case RealPosition.top:
            tooltipBox.style.left = left + "px";
            tooltipBox.style.top = top + "px";
            break;
        case RealPosition.left:
            tooltipBox.style.left = left + "px";
            tooltipBox.style.top = top + "px";
            break;
        case RealPosition.right:
            tooltipBox.style.left = left + "px";
            tooltipBox.style.top = top + "px";
            break;
        case RealPosition.center:
            tooltipBox.style.left = left + "px";
            tooltipBox.style.top = top + "px";
            break;
    }
    tooltipBox.className += " " + pos + " " + (css || "");
    isActive = true;
    if (!force) {
        setTimeout(function () {
            tooltipBox.className += " animate-tooltip";
        });
    }
}
function hideTooltip() {
    if (lastNode) {
        hideTimeout = setTimeout(function () {
            document.body.removeChild(tooltipBox);
            isActive = false;
            hideTimeout = null;
        }, 200);
    }
}
function addListners(node, text, position, css, force) {
    if (force === void 0) { force = false; }
    var mousemove = function () {
        if (isActive) {
            return;
        }
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(function () {
            showTooltip(node, text, position, css);
        }, 750);
    };
    var mouseout = function () {
        if (isActive) {
            hideTooltip();
        }
        clearTimeout(timeoutId);
        if (!force) {
            document.removeEventListener("mousemove", mousemove);
        }
        document.removeEventListener("mouseout", mouseout);
        document.removeEventListener("click", mouseout);
        lastNode = null;
    };
    if (force) {
        showTooltip(node, text, position, css, force);
    }
    else {
        document.addEventListener("mousemove", mousemove);
    }
    document.addEventListener("mouseout", mouseout);
    document.addEventListener("click", mouseout);
}
// default
function tooltip(text, at) {
    var node = html_1.toNode(at.node);
    if (node === lastNode) {
        return;
    }
    lastNode = node;
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
        addListners(node, text, at.position, at.css, true);
    }
    else {
        addListners(node, text, at.position || message_1.Position.bottom, at.css);
    }
}
exports.tooltip = tooltip;
function enableTooltip() {
    document.addEventListener("mousemove", _mousemove);
}
exports.enableTooltip = enableTooltip;
function disableTooltip() {
    document.removeEventListener("mousemove", _mousemove);
}
exports.disableTooltip = disableTooltip;
function _mousemove(e) {
    var node = html_1.locateNode(e, "dhx_tooltip_text");
    if (!node) {
        return;
    }
    tooltip(node.getAttribute("dhx_tooltip_text"), {
        position: node.getAttribute("dhx_tooltip_position") || message_1.Position.bottom,
        node: node
    });
}


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = __webpack_require__(3);
var dom_1 = __webpack_require__(0);
var html_1 = __webpack_require__(1);
var ts_message_1 = __webpack_require__(16);
var types_1 = __webpack_require__(4);
var helper_1 = __webpack_require__(13);
var itemfactory_1 = __webpack_require__(17);
var MenuBase_1 = __webpack_require__(18);
var Toolbar = /** @class */ (function (_super) {
    __extends(Toolbar, _super);
    function Toolbar(element, config) {
        var _this = _super.call(this, element, core_1.extend({
            navigationType: "click"
        }, config)) || this;
        _this._currentRoot = null;
        _this._factory = itemfactory_1.createFactory(types_1.ItemType.button);
        var render = function () { return _this._draw(); };
        _this.mount(element, dom_1.create({ render: render }));
        return _this;
    }
    Toolbar.prototype.getValues = function () {
        var state = {};
        this.data.eachChild(this.data.getRoot(), function (item) {
            if (item.twoState) {
                state[item.id] = item.active;
            }
            else if (item.type === types_1.ItemType.input) {
                state[item.id] = item.value;
            }
        }, false);
        for (var key in this._groups) {
            if (this._groups[key].active) {
                state[key] = this._groups[key].active;
            }
        }
        return state;
    };
    Toolbar.prototype.setValues = function (state) {
        for (var key in state) {
            if (this._groups[key]) {
                if (this._groups[key].active) {
                    this.data.update(this._groups[key].active, { active: false });
                    this._groups[key].active = state[key];
                    this.data.update(state[key], { active: true });
                }
            }
            else {
                var item = this.data.getItem(key);
                if (item.type === types_1.ItemType.input) {
                    this.data.update(key, { value: state[key] });
                }
                else {
                    this.data.update(key, { active: state[key] });
                }
            }
        }
    };
    Toolbar.prototype._initHandlers = function () {
        var _this = this;
        _super.prototype._initHandlers.call(this);
        this._onInput = function (e) {
            var id = html_1.locate(e);
            _this.data.update(id, { value: e.target.value });
        };
        this._showTooltip = function (e) {
            var elem = html_1.locateNode(e);
            if (!elem) {
                return;
            }
            var id = elem.getAttribute("dhx_id");
            var item = _this.data.getItem(id);
            if (item.tooltip) {
                ts_message_1.tooltip(item.tooltip, {
                    node: elem,
                    position: ts_message_1.Position.bottom
                });
            }
        };
    };
    Toolbar.prototype._draw = function () {
        var _this = this;
        return dom_1.el(".toolbar.dhx_widget" + (this.config.css ? "." + this.config.css : ""), {
            dhx_widget_id: this._uid,
            onclick: this._handlers.onclick,
            oninput: this._onInput,
            onmouseover: this._showTooltip
        }, this.data.map(function (item) { return _this._factory(item, _this.events); }, this.data.getRoot(), false));
    };
    Toolbar.prototype._getMode = function (item, root) {
        return item.id === root ? "bottom" : "right";
    };
    Toolbar.prototype._close = function () {
        this._activeMenu = null;
        this._activePosition = null;
        this._currentRoot = null;
        this.paint();
    };
    Toolbar.prototype._normalizeData = function () {
        var _this = this;
        var root = this.data.getRoot();
        var groups = {};
        this.data.eachChild(root, function (item) {
            if (item.type === types_1.ItemType.menuItem || item.type === types_1.ItemType.selectButton) {
                if (_this.data.haveChilds(item.id)) {
                    _this.data.eachChild(item.id, function (child) { return child.type = child.type || types_1.ItemType.menuItem; }, false);
                    if (item.parent !== root) {
                        item.$openIcon = "right";
                    }
                    else {
                        item.$openIcon = "bot";
                    }
                }
            }
            if (item.group) {
                helper_1.addInGroups(groups, item);
            }
        }, true);
        this._groups = groups;
    };
    Toolbar.prototype._setRoot = function (id) {
        if (this.data.getParent(id) === this.data.getRoot()) { // if we clicked on item which not belong root, we cant set it as root item
            this._currentRoot = id;
        }
    };
    return Toolbar;
}(MenuBase_1.MenuBase));
exports.Toolbar = Toolbar;


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__webpack_require__(28);
var ts_data_1 = __webpack_require__(8);
exports.DataCollection = ts_data_1.DataCollection;
var ts_message_1 = __webpack_require__(16);
exports.message = ts_message_1.message;
__export(__webpack_require__(42));
__export(__webpack_require__(15));
var en_1 = __webpack_require__(14);
exports.i18n = {};
exports.i18n.setLocale = function (component, value) {
    var target = exports.i18n[component];
    for (var key in value) {
        target[key] = value[key];
    }
};
exports.i18n.vault = exports.i18n.vault || en_1.default;


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),
/* 29 */,
/* 30 */,
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Promise) {
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = __webpack_require__(7);
var Loader = /** @class */ (function () {
    function Loader(parent, changes) {
        this._parent = parent;
        this._changes = changes; // todo: [dirty] mutation
    }
    Loader.prototype.load = function (url, driver) {
        var _this = this;
        return this._parent.loadData = url.load().then(function (data) {
            _this._parent.removeAll();
            _this.parse(data, driver);
        });
    };
    Loader.prototype.parse = function (data, driver) {
        if (driver === void 0) { driver = "json"; }
        driver = helpers_1.toDataDriver(driver);
        data = driver.toJsonArray(data);
        this._parent.$parse(data);
    };
    Loader.prototype.save = function (url) {
        var _this = this;
        var _loop_1 = function (el) {
            if (el.saving || el.pending) {
                helpers_1.dhxWarning("item is saving");
            }
            else {
                var prevEl_1 = this_1._findPrevState(el.id);
                if (prevEl_1 && prevEl_1.saving) {
                    var pending = new Promise(function (res, rej) {
                        prevEl_1.promise.then(function () {
                            el.pending = false;
                            res(_this._setPromise(el, url));
                        }).catch(function (err) {
                            _this._removeFromOrder(prevEl_1);
                            _this._setPromise(el, url);
                            helpers_1.dhxWarning(err);
                            rej(err);
                        });
                    });
                    this_1._addToChain(pending);
                    el.pending = true;
                }
                else {
                    this_1._setPromise(el, url);
                }
            }
        };
        var this_1 = this;
        for (var _i = 0, _a = this._changes.order; _i < _a.length; _i++) {
            var el = _a[_i];
            _loop_1(el);
        }
        this._parent.saveData.then(function () {
            _this._saving = false;
        });
    };
    Loader.prototype._setPromise = function (el, url) {
        var _this = this;
        el.promise = url.save(el.obj, el.status);
        el.promise.then(function () {
            _this._removeFromOrder(el);
        }).catch(function (err) {
            el.saving = false;
            el.error = true;
            helpers_1.dhxError(err);
        });
        el.saving = true;
        this._saving = true;
        this._addToChain(el.promise);
        return el.promise;
    };
    Loader.prototype._addToChain = function (promise) {
        // tslint:disable-next-line:prefer-conditional-expression
        if (this._parent.saveData && this._saving) {
            this._parent.saveData = this._parent.saveData.then(function () { return promise; });
        }
        else {
            this._parent.saveData = promise;
        }
    };
    Loader.prototype._findPrevState = function (id) {
        for (var _i = 0, _a = this._changes.order; _i < _a.length; _i++) {
            var el = _a[_i];
            if (el.id === id) {
                return el;
            }
        }
        return null;
    };
    Loader.prototype._removeFromOrder = function (el) {
        this._changes.order = this._changes.order.filter(function (item) { return !helpers_1.isEqualObj(item, el); });
    };
    return Loader;
}());
exports.Loader = Loader;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(10)))

/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

var apply = Function.prototype.apply;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) {
  if (timeout) {
    timeout.close();
  }
};

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// setimmediate attaches itself to the global object
__webpack_require__(33);
exports.setImmediate = setImmediate;
exports.clearImmediate = clearImmediate;


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global, process) {(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var registerImmediate;

    function setImmediate(callback) {
      // Callback can either be a function or a string
      if (typeof callback !== "function") {
        callback = new Function("" + callback);
      }
      // Copy function arguments
      var args = new Array(arguments.length - 1);
      for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i + 1];
      }
      // Store and register the task
      var task = { callback: callback, args: args };
      tasksByHandle[nextHandle] = task;
      registerImmediate(nextHandle);
      return nextHandle++;
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
        case 0:
            callback();
            break;
        case 1:
            callback(args[0]);
            break;
        case 2:
            callback(args[0], args[1]);
            break;
        case 3:
            callback(args[0], args[1], args[2]);
            break;
        default:
            callback.apply(undefined, args);
            break;
        }
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    run(task);
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function installNextTickImplementation() {
        registerImmediate = function(handle) {
            process.nextTick(function () { runIfPresent(handle); });
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        registerImmediate = function(handle) {
            global.postMessage(messagePrefix + handle, "*");
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        registerImmediate = function(handle) {
            channel.port2.postMessage(handle);
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(20), __webpack_require__(34)))

/***/ }),
/* 34 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = __webpack_require__(7);
var Sort = /** @class */ (function () {
    function Sort() {
    }
    Sort.prototype.sort = function (array, by) {
        var _this = this;
        if (by.rule && typeof by.rule === "function") {
            this._sort(array, by);
        }
        else if (by.by) {
            by.rule = function (a, b) {
                var aa = _this._checkVal(by.as, a[by.by]);
                var bb = _this._checkVal(by.as, b[by.by]);
                return helpers_1.naturalCompare(aa.toString(), bb.toString()); // didnt work with numbers
            };
            this._sort(array, by);
        }
    };
    Sort.prototype._checkVal = function (method, val) {
        return method ? method.call(this, val) : val;
    };
    Sort.prototype._sort = function (arr, conf) {
        var _this = this;
        var dir = {
            asc: 1,
            desc: -1
        };
        return arr.sort(function (a, b) {
            return conf.rule.call(_this, a, b) * (dir[conf.dir] || dir.asc);
        });
    };
    return Sort;
}());
exports.Sort = Sort;


/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var html_1 = __webpack_require__(1);
var types_1 = __webpack_require__(5);
var CollectionStore_1 = __webpack_require__(38);
var treecollection_1 = __webpack_require__(23);
var types_2 = __webpack_require__(6);
var DropPosition;
(function (DropPosition) {
    DropPosition[DropPosition["top"] = 0] = "top";
    DropPosition[DropPosition["bot"] = 1] = "bot";
    DropPosition[DropPosition["in"] = 2] = "in";
})(DropPosition || (DropPosition = {}));
function getParentElement(target) {
    if (target instanceof Event) {
        target = target.target;
    }
    while (target && target.getAttribute) {
        var id = target.getAttribute("dhx_id");
        if (id) {
            return target;
        }
        target = target.parentNode;
    }
}
function getPosition(ev) {
    var y = ev.y;
    var element = getParentElement(ev); // may be use domvm refs
    if (!element) {
        return null;
    }
    var treeLine = element.childNodes[0];
    var _a = treeLine.getBoundingClientRect(), top = _a.top, height = _a.height;
    return (y - top) / height;
}
function dragEventContent(item) {
    var ghost = document.createElement("div");
    ghost.textContent = item.value || item.text;
    ghost.className = "drag-ghost"; // need pointer-events: none
    return ghost;
}
var DragManager = /** @class */ (function () {
    function DragManager() {
        var _this = this;
        this._transferData = {};
        this._canMove = true;
        this._ghostTopPadding = -17;
        this._onMouseMove = function (e) {
            if (!_this._transferData.id) {
                return;
            }
            var pageX = e.pageX, pageY = e.pageY;
            if (!_this._transferData.ghost) {
                if (Math.abs(_this._transferData.x - pageX) < 3 && Math.abs(_this._transferData.y - pageY) < 3) {
                    return;
                }
                else {
                    var ghost = _this._onDragStart(_this._transferData.id, _this._transferData.targetId);
                    if (!ghost) {
                        _this._endDrop();
                        return;
                    }
                    else {
                        _this._transferData.ghost = ghost;
                        document.body.appendChild(_this._transferData.ghost);
                    }
                }
            }
            _this._moveGhost(pageX, pageY);
            _this._onDrag(e);
        };
        this._onMouseUp = function () {
            if (!_this._transferData.x) {
                return;
            }
            if (_this._transferData.ghost) {
                _this._removeGhost();
                _this._onDrop();
            }
            else {
                _this._endDrop();
            }
            document.removeEventListener("mousemove", _this._onMouseMove);
            document.removeEventListener("mouseup", _this._onMouseUp);
        };
    }
    DragManager.prototype.setItem = function (id, item, config) {
        // const collection = document.querySelector(`[dhx_collection_id=${id}]`); // use it for add onmousedown here
        CollectionStore_1.collectionStore.setItem(id, item, config);
    };
    DragManager.prototype.onMouseDown = function (e) {
        if (e.which !== 1) {
            return;
        }
        document.addEventListener("mousemove", this._onMouseMove);
        document.addEventListener("mouseup", this._onMouseUp);
        var id = html_1.locate(e, "dhx_id");
        var targetId = html_1.locate(e, "dhx_collection_id");
        if (id && targetId) {
            this._transferData.x = e.x;
            this._transferData.y = e.y;
            this._transferData.targetId = targetId;
            this._transferData.id = id;
        }
    };
    DragManager.prototype._moveGhost = function (x, y) {
        if (this._transferData.ghost) {
            var width = this._transferData.ghost.offsetWidth / 2;
            this._transferData.ghost.style.left = x - width + "px";
            this._transferData.ghost.style.top = y + this._ghostTopPadding + "px";
        }
    };
    DragManager.prototype._removeGhost = function () {
        document.body.removeChild(this._transferData.ghost);
    };
    DragManager.prototype._onDrop = function () {
        if (!this._canMove) {
            this._endDrop();
            return;
        }
        var target = CollectionStore_1.collectionStore.getItem(this._lastCollectionId);
        var config = CollectionStore_1.collectionStore.getItemConfig(this._lastCollectionId);
        if (!target || config.mode === types_2.DragMode.source) {
            this._endDrop();
            return;
        }
        var to = {
            id: this._lastId,
            target: target
        };
        var from = {
            id: this._transferData.id,
            target: this._transferData.target
        };
        if (from.target.events.fire(types_1.DragEvents.beforeDrop, [from, to])) {
            this._move(from, to);
            to.target.events.fire(types_1.DragEvents.dropComplete, [to.id, this._transferData.dropPosition]);
        }
        this._endDrop();
    };
    DragManager.prototype._onDragStart = function (id, targetId) {
        var target = CollectionStore_1.collectionStore.getItem(targetId);
        var config = CollectionStore_1.collectionStore.getItemConfig(targetId);
        if (config.dragMode === types_2.DragMode.target) {
            return null;
        }
        var item = target.data.getItem(id);
        target.events.fire(types_1.DragEvents.dragStart); // we need it for cancel selection
        var ghost = dragEventContent(item);
        var ans = target.events.fire(types_1.DragEvents.beforeDrag, [item, ghost]);
        if (!ans || !id) {
            return null;
        }
        this._toggleTextSelection(true);
        this._transferData.target = target;
        this._transferData.dragConfig = config;
        return ghost;
    };
    DragManager.prototype._onDrag = function (e) {
        var x = e.x, y = e.y;
        var element = document.elementFromPoint(x, y);
        var id = html_1.locate(element, "dhx_id");
        if (!id) {
            this._cancelCanDrop();
            return;
        }
        var collectionId = html_1.locate(element, "dhx_collection_id");
        if (this._transferData.dragConfig.behaviour === types_2.DragBehaviour.complex) {
            var pos = getPosition(e);
            if (pos <= 0.25) {
                this._transferData.dropPosition = DropPosition.top;
            }
            else if (pos >= 0.75) {
                this._transferData.dropPosition = DropPosition.bot;
            }
            else {
                this._transferData.dropPosition = DropPosition.in;
            }
        }
        else if (this._lastId === id && this._lastCollectionId === collectionId) {
            return;
        }
        var eventArgs;
        var from;
        var targetTo;
        if ((!id || !collectionId) && this._canMove) {
            this._cancelCanDrop();
            return;
        }
        else {
            from = {
                id: this._transferData.id,
                target: this._transferData.target
            };
            targetTo = CollectionStore_1.collectionStore.getItem(collectionId);
            eventArgs = [from, {
                    id: id,
                    target: targetTo
                }];
            from.target.events.fire(types_1.DragEvents.dragOut, eventArgs);
        }
        if (collectionId !== this._transferData.targetId || !(from.target.data instanceof treecollection_1.TreeCollection) ||
            (from.target.data instanceof treecollection_1.TreeCollection && from.target.data.canCopy(from.id, id))) {
            // handle cursor or something, can drop
            this._cancelCanDrop(); // clear last
            this._lastId = id;
            this._lastCollectionId = collectionId;
            eventArgs.push(this._transferData.dropPosition);
            var canMove = from.target.events.fire(types_1.DragEvents.dragIn, eventArgs);
            if (canMove) {
                this._canDrop();
            }
        }
        else {
            this._cancelCanDrop();
        }
    };
    DragManager.prototype._move = function (from, to) {
        var fromData = from.target.data;
        var toData = to.target.data;
        var index = 0;
        var targetId = to.id;
        var behaviour = this._transferData.dragConfig.behaviour;
        switch (behaviour) {
            case types_2.DragBehaviour.child:
                break;
            case types_2.DragBehaviour.sibling:
                targetId = toData.getParent(targetId);
                index = toData.getIndex(to.id) + 1;
                break;
            case types_2.DragBehaviour.complex:
                var dropPosition = this._transferData.dropPosition;
                if (dropPosition === DropPosition.top) {
                    targetId = toData.getParent(targetId);
                    index = toData.getIndex(to.id);
                }
                else if (dropPosition === DropPosition.bot) {
                    targetId = toData.getParent(targetId);
                    index = toData.getIndex(to.id) + 1;
                }
                break;
        }
        if (this._transferData.dragConfig.copy) {
            fromData.copy(from.id, index, toData, targetId);
        }
        else {
            fromData.move(from.id, index, toData, targetId);
        }
    };
    DragManager.prototype._endDrop = function () {
        this._toggleTextSelection(false);
        if (this._transferData.target) {
            this._transferData.target.events.fire(types_1.DragEvents.dragEnd);
        }
        this._cancelCanDrop();
        this._canMove = true;
        this._transferData = {};
        this._lastId = null;
        this._lastCollectionId = null;
    };
    DragManager.prototype._cancelCanDrop = function () {
        this._canMove = false;
        var collection = CollectionStore_1.collectionStore.getItem(this._lastCollectionId);
        if (collection && this._lastId) {
            collection.events.fire(types_1.DragEvents.cancelDrop, [this._lastId]);
        }
    };
    DragManager.prototype._canDrop = function () {
        this._canMove = true;
        var collection = CollectionStore_1.collectionStore.getItem(this._lastCollectionId);
        if (collection && this._lastId) {
            collection.events.fire(types_1.DragEvents.canDrop, [this._lastId, this._transferData.dropPosition]);
        }
    };
    DragManager.prototype._toggleTextSelection = function (add) {
        if (add) {
            document.body.classList.add("dhx-no-select");
        }
        else {
            document.body.classList.remove("dhx-no-select");
        }
    };
    return DragManager;
}());
exports.dragManager = new DragManager();


/***/ }),
/* 37 */
/***/ (function(module, exports) {

if (Element && !Element.prototype.matches) {
    var proto = Element.prototype;
    proto.matches = proto.matchesSelector ||
        proto.mozMatchesSelector || proto.msMatchesSelector ||
        proto.oMatchesSelector || proto.webkitMatchesSelector;
}


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var CollectionStore = /** @class */ (function () {
    function CollectionStore() {
        this._store = {};
    }
    CollectionStore.prototype.setItem = function (id, target, config) {
        this._store[id] = {
            target: target,
            config: config
        };
    };
    CollectionStore.prototype.getItem = function (id) {
        if (!this._store[id]) {
            return null;
        }
        return this._store[id].target;
    };
    CollectionStore.prototype.getItemConfig = function (id) {
        if (!this._store[id]) {
            return null;
        }
        return this._store[id].config;
    };
    return CollectionStore;
}());
exports.collectionStore = new CollectionStore();


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = __webpack_require__(9);
var types_1 = __webpack_require__(5);
var types_2 = __webpack_require__(6);
var Selection = /** @class */ (function () {
    function Selection(_config, data, events) {
        var _this = this;
        this.events = events || (new events_1.EventSystem());
        this._data = data;
        this._data.events.on(types_2.DataEvents.removeAll, function () {
            _this._selected = null;
        });
        this._data.events.on(types_2.DataEvents.change, function () {
            if (_this._selected) {
                var near = _this._data.getNearId(_this._selected);
                if (near !== _this._selected) {
                    _this._selected = null;
                    if (near) {
                        _this.add(near);
                    }
                }
            }
        });
    }
    Selection.prototype.getId = function () {
        return this._selected;
    };
    Selection.prototype.getItem = function () {
        if (this._selected) {
            return this._data.getItem(this._selected);
        }
        return null;
    };
    Selection.prototype.remove = function (id) {
        id = id || this._selected;
        if (!id) {
            return true;
        }
        if (this.events.fire(types_1.SelectionEvents.beforeUnSelect, [id])) {
            this._data.update(id, { $selected: false });
            this._selected = null;
            this.events.fire(types_1.SelectionEvents.afterUnSelect, [id]);
            return true;
        }
        return false;
    };
    Selection.prototype.add = function (id) {
        if (this._selected === id) {
            return;
        }
        this.remove();
        if (this.events.fire(types_1.SelectionEvents.beforeSelect, [id])) {
            this._selected = id;
            this._data.update(id, { $selected: true });
            this.events.fire(types_1.SelectionEvents.afterSelect, [id]);
        }
    };
    return Selection;
}());
exports.Selection = Selection;


/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Promise) {
Object.defineProperty(exports, "__esModule", { value: true });
var en_1 = __webpack_require__(41);
function blockKeys(e) {
    var active = document.activeElement;
    if (!active.classList.contains("apply-button") && !active.classList.contains("reject-button")) {
        e.preventDefault();
    }
}
function blockScreen(css) {
    var blocker = document.createElement("div");
    blocker.className = "dhx-blocker " + (css || "");
    document.body.appendChild(blocker);
    document.addEventListener("keydown", blockKeys);
    return function () {
        document.body.removeChild(blocker);
        document.removeEventListener("keydown", blockKeys);
    };
}
exports.blockScreen = blockScreen;
function alert(props) {
    var apply = props.buttons && props.buttons[0] ? props.buttons[0] : en_1.default.apply;
    var unblock = blockScreen(props.blockerCss);
    return new Promise(function (res) {
        var alertBox = document.createElement("div");
        alertBox.className = "dhx-alert " + (props.css || "");
        alertBox.innerHTML = "\n\t\t\t<div class=\"message-box-header\">\n\t\t\t\t<div class=\"mesage-box-title\">" + props.header + "</div>\n\t\t\t</div>\n\t\t\t<div class=\"alert-message\">" + props.text + "</div>\n\t\t\t<div class=\"action-button " + (props.buttonsAlignment ? props.buttonsAlignment : "") + "\">\n\t\t\t\t<button class=\"apply-button alert-btn dhx_btn dhx_btn--flat\">" + apply + "</button>\n\t\t\t</div>";
        document.body.appendChild(alertBox);
        alertBox.querySelector(".apply-button").focus();
        alertBox.querySelector("button").addEventListener("click", function () {
            unblock();
            document.body.removeChild(alertBox);
            res(true);
        });
    });
}
exports.alert = alert;
function confirm(props) {
    var apply = props.buttons && props.buttons[1] ? props.buttons[1] : en_1.default.apply;
    var reject = props.buttons && props.buttons[0] ? props.buttons[0] : en_1.default.reject;
    var unblock = blockScreen(props.blockerCss);
    return new Promise(function (res) {
        var answer = function (val) {
            unblock();
            confirmBox.removeEventListener("click", clickHandler);
            document.body.removeChild(confirmBox);
            res(val);
        };
        var confirmBox = document.createElement("div");
        confirmBox.className = "dhx-confirm " + (props.css || "");
        confirmBox.innerHTML = "\n\t\t\t<div class=\"message-box-header\">\n\t\t\t\t<div class=\"mesage-box-title\">" + props.header + "</div>\n\t\t\t</div>\n\t\t\t<div class=\"confirm-message\">" + props.text + "</div>\n\t\t\t<div class=\"action-button " + (props.buttonsAlignment ? props.buttonsAlignment : "") + "\">\n\t\t\t\t<button class=\"reject-button dhx_btn dhx_btn--link\">" + reject + "</button>\n\t\t\t\t<button class=\"apply-button dhx_btn dhx_btn--flat\">" + apply + "</button>\n\t\t\t</div>";
        document.body.appendChild(confirmBox);
        confirmBox.querySelector(".reject-button").focus();
        var clickHandler = function (e) {
            if (e.target.tagName === "BUTTON") {
                answer(e.target.classList.contains("apply-button"));
            }
        };
        confirmBox.addEventListener("click", clickHandler);
    });
}
exports.confirm = confirm;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(10)))

/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var locale = {
    apply: "apply",
    reject: "reject"
};
exports.default = locale;


/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = __webpack_require__(3);
var dom_1 = __webpack_require__(0);
var events_1 = __webpack_require__(9);
var html_1 = __webpack_require__(1);
var scrollView_1 = __webpack_require__(44);
var view_1 = __webpack_require__(12);
var ts_data_1 = __webpack_require__(8);
var ts_layout_1 = __webpack_require__(45);
var ts_message_1 = __webpack_require__(16);
var ts_toolbar_1 = __webpack_require__(48);
var en_1 = __webpack_require__(14);
var types_1 = __webpack_require__(15);
var Uploader_1 = __webpack_require__(64);
var configs_1 = __webpack_require__(65);
var helper_1 = __webpack_require__(66);
var ProgressBar_1 = __webpack_require__(67);
var ReadStackPreview_1 = __webpack_require__(68);
var Vault = /** @class */ (function (_super) {
    __extends(Vault, _super);
    function Vault(container, config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, null, core_1.extend({
            mode: types_1.VaultMode.list,
            toolbar: true,
            updateFromResponse: true,
            scaleFactor: 4,
            customScroll: true,
            uploader: {},
            progressBar: {}
        }, config)) || this;
        if (!_this.config.toolbar) {
            _this.config.uploader.autosend = true;
        }
        if (config.data) {
            _this.data = config.data;
            _this.events = config.data.events;
            _this.events.context = _this;
        }
        else {
            _this.events = new events_1.EventSystem(_this);
            _this.data = new ts_data_1.DataCollection({}, _this.events);
        }
        _this.data.config.init = function (obj) {
            obj.status = obj.status || types_1.FileStatus.uploaded;
            if (obj.file) {
                obj.size = obj.file.size;
                obj.name = obj.file.name;
            }
            else {
                obj.size = obj.size || 0;
                obj.name = obj.name || "";
            }
            if (_this.config.mode === types_1.VaultMode.grid && obj.file && helper_1.isImage(obj)) {
                _this._readStack.add(obj, _this.uploader.config.autosend);
            }
            return obj;
        };
        _this._readStack = new ReadStackPreview_1.ReadStackPreview(_this.data);
        _this.uploader = new Uploader_1.Uploader(_this.config.uploader, _this.data, _this.events);
        _this._scrollView = new scrollView_1.ScrollView(function () { return _this.getRootView(); });
        _this._progressBar = new ProgressBar_1.ProgressBar(_this.events, _this.config.progressBar);
        _this.events.on(types_1.UploaderEvents.uploadProgress, function (progress, current, total) { return _this._progressBar.setState(progress, { current: current, total: total }); });
        _this._initHandlers();
        _this._initUI(container);
        _this._initEvents();
        return _this;
    }
    Vault.prototype.destructor = function () {
        this.toolbar.destructor();
        this._readStack.stop();
        this.uploader.unlinkDropArea();
        this.uploader.abort();
    };
    Vault.prototype._initUI = function (container) {
        var _this = this;
        var cfg = this.config.toolbar ? configs_1.layoutConfig : configs_1.layoutConfigWithoutTopbar;
        cfg.on = this._getDragEvents();
        var layout = this._layout = new ts_layout_1.Layout(container, cfg);
        var toolbar = this.toolbar = new ts_toolbar_1.Toolbar(null, { css: "vault-toolbar" });
        var defaultButtons = [
            {
                id: "add",
                tooltip: en_1.default.add,
                type: ts_toolbar_1.ItemType.iconButton,
                icon: "dxi-plus"
            },
            {
                id: "upload",
                tooltip: en_1.default.upload,
                type: ts_toolbar_1.ItemType.iconButton,
                icon: "dxi icon-upload" // Custom Web Font Icon
            },
            {
                type: "spacer"
            },
            {
                id: "remove-all",
                tooltip: en_1.default.clearAll,
                type: ts_toolbar_1.ItemType.iconButton,
                icon: "dxi-delete-forever"
            }
        ];
        this.toolbar.data.parse(defaultButtons);
        this._hideUploadAndDeleteButtons();
        var render = function () { return _this._draw(); };
        this.mount(null, dom_1.create({ render: render }));
        if (this.config.toolbar) {
            layout.cell("topbar").attach(toolbar);
        }
        layout.cell("vault").attach(this);
    };
    Vault.prototype._initHandlers = function () {
        var _this = this;
        this._handlers = {
            onclick: {
                ".action-add": function () { return _this.uploader.selectFile(); },
                ".action-remove-file": function (e) {
                    var id = html_1.locate(e);
                    if (!id) {
                        return;
                    }
                    _this.data.update(id, { $toRemove: true });
                    setTimeout(function () {
                        _this.data.update(id, { $toRemove: false }, true);
                        _this.data.remove(id);
                    }, 200);
                }
            },
            onmouseover: {
                ".action-download": function (e) {
                    ts_message_1.tooltip(en_1.default.download, {
                        node: e.target,
                        position: ts_message_1.Position.bottom
                    });
                },
                ".action-remove-file": function (e) {
                    ts_message_1.tooltip(en_1.default.clear, {
                        node: e.target,
                        position: ts_message_1.Position.bottom
                    });
                },
                ".title-content, .dhx-file-name": function (e) {
                    var id = html_1.locate(e);
                    var item = _this.data.getItem(id);
                    ts_message_1.tooltip(item.name, {
                        node: e.target,
                        position: ts_message_1.Position.bottom,
                        css: "tooltip-light"
                    });
                }
            }
        };
    };
    Vault.prototype._getDragEvents = function () {
        var _this = this;
        var rect = {
            left: null,
            top: null,
            width: null,
            height: null
        };
        return {
            dragleave: function (e) {
                if (!_this._canDrop) {
                    return;
                }
                if (e.pageX > rect.left + rect.width - 1 || e.pageX < rect.left || e.pageY > rect.top + rect.height - 1 || e.pageY < rect.top) {
                    _this._canDrop = false;
                    if (_this.config.toolbar) {
                        _this._layout.cell("topbar").show();
                    }
                    _this._layout.config.css = "vault-layout";
                    _this._layout.paint();
                }
            },
            dragenter: function (e) {
                e.preventDefault();
                if (_this.uploader.isActive || _this._canDrop) {
                    return;
                }
                var types = e.dataTransfer.types;
                for (var _i = 0, types_2 = types; _i < types_2.length; _i++) {
                    var type = types_2[_i];
                    if (type !== "Files" && type !== "application/x-moz-file") {
                        _this._canDrop = false;
                        return;
                    }
                }
                _this._canDrop = true;
                var clientRect = _this._layout.getRootView().node.el.getBoundingClientRect();
                rect.left = clientRect.left + window.pageXOffset;
                rect.top = clientRect.top + window.pageYOffset;
                rect.width = clientRect.width;
                rect.height = clientRect.height;
                _this._canDrop = true;
                if (_this.config.toolbar) {
                    _this._layout.cell("topbar").hide();
                }
                _this._layout.config.css = "vault-layout dhx-dragin";
                _this._layout.paint();
            },
            dragover: function (e) {
                e.preventDefault();
            },
            drop: function (e) {
                e.preventDefault();
                if (!_this._canDrop) {
                    return;
                }
                var dataTransfer = e.dataTransfer;
                _this.uploader.parseFiles(dataTransfer);
                _this._canDrop = false;
                if (_this.config.toolbar) {
                    _this._layout.cell("topbar").show();
                }
                _this._layout.config.css = "vault-layout";
                _this._layout.paint();
            }
        };
    };
    Vault.prototype._hideUploadAndDeleteButtons = function () {
        this.toolbar.hide(["upload", "remove-all"]);
    };
    Vault.prototype._showUploadAndDeleteButtons = function () {
        if (this.uploader.config.autosend) {
            this.toolbar.show("remove-all");
        }
        else {
            this.toolbar.show(["upload", "remove-all"]);
        }
    };
    Vault.prototype._initEvents = function () {
        var _this = this;
        this.data.events.on(types_1.DataEvents.change, function () {
            if (!_this.data.getLength()) {
                _this._hideUploadAndDeleteButtons();
            }
            else {
                _this._showUploadAndDeleteButtons();
            }
            _this.paint();
        });
        this.events.on(types_1.UploaderEvents.uploadBegin, function () {
            if (_this.config.toolbar) {
                _this._layout.cell("topbar").attach(_this._progressBar);
            }
        });
        this.events.on(types_1.UploaderEvents.uploadComplete, function () {
            if (_this.config.mode === types_1.VaultMode.grid && _this.uploader.config.autosend) {
                _this._readStack.read();
            }
            if (_this.config.toolbar) {
                _this._layout.cell("topbar").attach(_this.toolbar);
            }
        });
        this.toolbar.events.on(ts_toolbar_1.ToolbarEvents.click, function (id) {
            switch (id) {
                case "add":
                    _this.uploader.selectFile();
                    break;
                case "remove-all":
                    _this.data.removeAll();
                    break;
                case "upload":
                    _this.uploader.send();
                    break;
            }
        });
        this.events.on(types_1.ProgressBarEvents.cancel, function () {
            _this.uploader.abort();
            _this.paint();
        });
    };
    Vault.prototype._draw = function () {
        var isEmpty = !this.data.getLength();
        var files = this.config.mode === types_1.VaultMode.grid ? this._drawGrid() : this._drawList();
        return dom_1.el("div", __assign({ class: "vault dhx_widget" + (this._canDrop ? " drop-here" : "") }, this._handlers, { dhx_widget_id: this._uid }), [
            this._canDrop || isEmpty ? this._drawDropableArea() :
                this.config.customScroll ? this._scrollView.render(files) : files
        ]);
    };
    Vault.prototype._getFileActions = function (file) {
        var defaultActions = [];
        var hoverActions = [];
        var actions = [
            dom_1.el(".dhx-default-actions", defaultActions),
            dom_1.el(".dhx-hover-actions", hoverActions)
        ];
        if (file.status === types_1.FileStatus.inprogress) {
            return actions;
        }
        if (file.status !== types_1.FileStatus.failed && file.link) {
            var link = (this.config.downloadURL || "") + file.link;
            var downloadName = link.split("/").pop().split("?")[0];
            var download = dom_1.el("a", {
                download: downloadName,
                class: "download-link",
                href: link
            }, [
                dom_1.el(".icon-btn.dxi.dxi-download.action-download")
            ]);
            hoverActions.push(download);
        }
        var remove = dom_1.el(".icon-btn.dxi.dxi-delete-forever.action-remove-file");
        hoverActions.push(remove);
        if (file.status === types_1.FileStatus.failed) {
            var warn = dom_1.el(".dxi.dxi-alert-circle.warning-status");
            defaultActions.push(warn);
        }
        if (file.status === types_1.FileStatus.uploaded) {
            var uploadComplete = dom_1.el(".dxi.dxi-checkbox-marked-circle.uploaded-status");
            defaultActions.push(uploadComplete);
        }
        return actions;
    };
    Vault.prototype._drawList = function () {
        var _this = this;
        return dom_1.el(".dhx-files-block.dhx-webkit-scroll", this.data.map(function (item) {
            var isError = item.status === types_1.FileStatus.failed && item.request;
            var inProgress = item.status === types_1.FileStatus.inprogress;
            var inQueue = item.status === types_1.FileStatus.queue;
            var notUploaded = item.status !== types_1.FileStatus.uploaded;
            return dom_1.el("div", {
                class: "dhx-file-item" + (item.$toRemove ? " to-remove" : "") + (inQueue ? " in-queue" : ""),
                dhx_id: item.id,
                _key: item.id
            }, [
                dom_1.el(".dhx-file-icon", [
                    dom_1.el("div", {
                        class: "dhx-file-type " + helper_1.getFileClassName(item) + (notUploaded ? " not-loaded" : "")
                    })
                ]),
                dom_1.el(".dhx-file-title", [
                    dom_1.el(".dhx-title-content", item.name),
                    dom_1.el(".dhx-file-info", [
                        isError && dom_1.el(".warn-message", item.request.statusText || en_1.default.error),
                        inProgress ? dom_1.el(".progress-value", (item.progress * 100).toFixed(1) + "%")
                            : dom_1.el(".dhx-size" + (isError && ".dhx-size-error" || ""), helper_1.getBasis(item.size))
                    ])
                ]),
                inProgress && dom_1.el(".dhx-download-progress", {
                    style: {
                        width: (item.progress * 100).toFixed(1) + "%"
                    }
                }),
                !inProgress && dom_1.el(".dhx-file-action", _this._getFileActions(item))
            ]);
        }));
    };
    Vault.prototype._drawDropableArea = function () {
        return dom_1.el(".dhx-dropable-area.drop-files-here", [
            dom_1.el(".dhx-big-icon-block", [
                dom_1.el(".dxi.icon-upload") // Custom Web Font Icon
            ]),
            !this._canDrop && dom_1.el(".drop-area-bold-text", en_1.default.dragAndDrop),
            !this._canDrop && dom_1.el(".drop-area-bold-text", en_1.default.filesOrFoldersHere),
            !this._canDrop && dom_1.el(".drop-area-light-text", en_1.default.or),
            !this._canDrop && dom_1.el("button.dhx_btn.dhx_btn--flat.dhx_btn--small.action-add", en_1.default.browse)
        ]);
    };
    Vault.prototype._drawGrid = function () {
        var _this = this;
        return dom_1.el("div", {
            class: "dhx-files-grid dhx-webkit-scroll"
        }, [
            dom_1.el(".dhx-grid-content", this.data.map(function (item) {
                var inProgress = item.status === types_1.FileStatus.inprogress;
                var inQueue = item.status === types_1.FileStatus.queue;
                var isError = item.status === types_1.FileStatus.failed;
                return dom_1.el("div", {
                    class: "dhx-file-grid-item" + (inProgress ? " in-progress" : "")
                        + (item.$toRemove ? " to-remove" : "") + (inQueue ? " in-queue" : "") + (isError ? " failed" : ""),
                    dhx_id: item.id,
                    _key: item.id
                }, [
                    dom_1.el(".dhx-preview-wrapper", [
                        item.preview ? dom_1.el(".dhx-server-file-preview", [
                            dom_1.el("img", { src: item.preview })
                        ]) :
                            item.image ? dom_1.el("canvas", {
                                width: 98 * _this.config.scaleFactor,
                                height: 98 * _this.config.scaleFactor,
                                _hooks: {
                                    didInsert: function (node) {
                                        var _a = helper_1.calculateCover(item.image), dx = _a.dx, dy = _a.dy, sx = _a.sx, sy = _a.sy, sHeight = _a.sHeight, sWidth = _a.sWidth;
                                        var ctx = node.el.getContext("2d");
                                        ctx.drawImage(item.image, sx, sy, sWidth, sHeight, dx, dy, 98 * _this.config.scaleFactor, 98 * _this.config.scaleFactor);
                                    }
                                }
                            }) : dom_1.el("div", {
                                class: "dhx-file-preview dhx-file-type " + helper_1.getFileClassName(item)
                            }),
                        inProgress && _this._drawCircle(item.progress)
                    ].concat(_this._getFileActions(item), [
                        dom_1.el(".dhx-file-info", [
                            isError && dom_1.el(".warn-message", item.request.statusText || en_1.default.error),
                            !inProgress && dom_1.el(".dhx-size" + (isError && ".dhx-size-error" || ""), helper_1.getBasis(item.size))
                        ])
                    ])),
                    dom_1.el(".dhx-file-name", helper_1.truncateWord(item.name))
                ]);
            }))
        ]);
    };
    Vault.prototype._drawCircle = function (progress) {
        return dom_1.el(".progress-layout", [
            dom_1.el(".progress-amount", (progress * 100).toFixed(1) + "%"),
            dom_1.sv("svg", {
                xmlns: "http://www.w3.org/2000/svg",
                class: "progress-circle",
                viewBox: "0 0 60 60",
            }, [
                dom_1.sv("circle", {
                    "cx": 30,
                    "cy": 30,
                    "r": 28,
                    "stroke-width": 4,
                    "class": "progress-bar-background",
                }),
                dom_1.sv("circle.active-circle", {
                    "cx": 30,
                    "cy": 30,
                    "r": 28,
                    "stroke-width": 4,
                    "stroke-dasharray": "175.9 175.9",
                    "stroke-dashoffset": (1 - progress) * 175.9,
                    "class": "progress-bar-active",
                }),
            ])
        ]);
    };
    return Vault;
}(view_1.View));
exports.Vault = Vault;


/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

/**
* Copyright (c) 2017, Leon Sorokin
* All rights reserved. (MIT Licensed)
*
* domvm.js (DOM ViewModel)
* A thin, fast, dependency-free vdom view layer
* @preserve https://github.com/leeoniya/domvm (v3.2.6, micro build)
*/

(function (global, factory) {
	 true ? module.exports = factory() :
	undefined;
}(this, (function () { 'use strict';

// NOTE: if adding a new *VNode* type, make it < COMMENT and renumber rest.
// There are some places that test <= COMMENT to assert if node is a VNode

// VNode types
var ELEMENT	= 1;
var TEXT		= 2;
var COMMENT	= 3;

// placeholder types
var VVIEW		= 4;
var VMODEL		= 5;

var ENV_DOM = typeof window !== "undefined";
var win = ENV_DOM ? window : {};
var rAF = win.requestAnimationFrame;

var emptyObj = {};

function noop() {}

var isArr = Array.isArray;

function isSet(val) {
	return val != null;
}

function isPlainObj(val) {
	return val != null && val.constructor === Object;		//  && typeof val === "object"
}

function insertArr(targ, arr, pos, rem) {
	targ.splice.apply(targ, [pos, rem].concat(arr));
}

function isVal(val) {
	var t = typeof val;
	return t === "string" || t === "number";
}

function isFunc(val) {
	return typeof val === "function";
}

function isProm(val) {
	return typeof val === "object" && isFunc(val.then);
}



function assignObj(targ) {
	var args = arguments;

	for (var i = 1; i < args.length; i++)
		{ for (var k in args[i])
			{ targ[k] = args[i][k]; } }

	return targ;
}

// export const defProp = Object.defineProperty;

function deepSet(targ, path, val) {
	var seg;

	while (seg = path.shift()) {
		if (path.length === 0)
			{ targ[seg] = val; }
		else
			{ targ[seg] = targ = targ[seg] || {}; }
	}
}

/*
export function deepUnset(targ, path) {
	var seg;

	while (seg = path.shift()) {
		if (path.length === 0)
			targ[seg] = val;
		else
			targ[seg] = targ = targ[seg] || {};
	}
}
*/

function sliceArgs(args, offs) {
	var arr = [];
	for (var i = offs; i < args.length; i++)
		{ arr.push(args[i]); }
	return arr;
}

function cmpObj(a, b) {
	for (var i in a)
		{ if (a[i] !== b[i])
			{ return false; } }

	return true;
}

function cmpArr(a, b) {
	var alen = a.length;

	if (b.length !== alen)
		{ return false; }

	for (var i = 0; i < alen; i++)
		{ if (a[i] !== b[i])
			{ return false; } }

	return true;
}

// https://github.com/darsain/raft
// rAF throttler, aggregates multiple repeated redraw calls within single animframe
function raft(fn) {
	if (!rAF)
		{ return fn; }

	var id, ctx, args;

	function call() {
		id = 0;
		fn.apply(ctx, args);
	}

	return function() {
		ctx = this;
		args = arguments;
		if (!id) { id = rAF(call); }
	};
}

function curry(fn, args, ctx) {
	return function() {
		return fn.apply(ctx, args);
	};
}

/*
export function prop(val, cb, ctx, args) {
	return function(newVal, execCb) {
		if (newVal !== undefined && newVal !== val) {
			val = newVal;
			execCb !== false && isFunc(cb) && cb.apply(ctx, args);
		}

		return val;
	};
}
*/

/*
// adapted from https://github.com/Olical/binary-search
export function binaryKeySearch(list, item) {
    var min = 0;
    var max = list.length - 1;
    var guess;

	var bitwise = (max <= 2147483647) ? true : false;
	if (bitwise) {
		while (min <= max) {
			guess = (min + max) >> 1;
			if (list[guess].key === item) { return guess; }
			else {
				if (list[guess].key < item) { min = guess + 1; }
				else { max = guess - 1; }
			}
		}
	} else {
		while (min <= max) {
			guess = Math.floor((min + max) / 2);
			if (list[guess].key === item) { return guess; }
			else {
				if (list[guess].key < item) { min = guess + 1; }
				else { max = guess - 1; }
			}
		}
	}

    return -1;
}
*/

// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
// impl borrowed from https://github.com/ivijs/ivi
function longestIncreasingSubsequence(a) {
	var p = a.slice();
	var result = [];
	result.push(0);
	var u;
	var v;

	for (var i = 0, il = a.length; i < il; ++i) {
		var j = result[result.length - 1];
		if (a[j] < a[i]) {
			p[i] = j;
			result.push(i);
			continue;
		}

		u = 0;
		v = result.length - 1;

		while (u < v) {
			var c = ((u + v) / 2) | 0;
			if (a[result[c]] < a[i]) {
				u = c + 1;
			} else {
				v = c;
			}
		}

		if (a[i] < a[result[u]]) {
			if (u > 0) {
				p[i] = result[u - 1];
			}
			result[u] = i;
		}
	}

	u = result.length;
	v = result[u - 1];

	while (u-- > 0) {
		result[u] = v;
		v = p[v];
	}

	return result;
}

// based on https://github.com/Olical/binary-search
function binaryFindLarger(item, list) {
	var min = 0;
	var max = list.length - 1;
	var guess;

	var bitwise = (max <= 2147483647) ? true : false;
	if (bitwise) {
		while (min <= max) {
			guess = (min + max) >> 1;
			if (list[guess] === item) { return guess; }
			else {
				if (list[guess] < item) { min = guess + 1; }
				else { max = guess - 1; }
			}
		}
	} else {
		while (min <= max) {
			guess = Math.floor((min + max) / 2);
			if (list[guess] === item) { return guess; }
			else {
				if (list[guess] < item) { min = guess + 1; }
				else { max = guess - 1; }
			}
		}
	}

	return (min == list.length) ? null : min;

//	return -1;
}

function isEvProp(name) {
	return name[0] === "o" && name[1] === "n";
}

function isSplProp(name) {
	return name[0] === "_";
}

function isStyleProp(name) {
	return name === "style";
}

function repaint(node) {
	node && node.el && node.el.offsetHeight;
}

function isHydrated(vm) {
	return vm.node != null && vm.node.el != null;
}

// tests interactive props where real val should be compared
function isDynProp(tag, attr) {
//	switch (tag) {
//		case "input":
//		case "textarea":
//		case "select":
//		case "option":
			switch (attr) {
				case "value":
				case "checked":
				case "selected":
//				case "selectedIndex":
					return true;
			}
//	}

	return false;
}

function getVm(n) {
	n = n || emptyObj;
	while (n.vm == null && n.parent)
		{ n = n.parent; }
	return n.vm;
}

function VNode() {}

var VNodeProto = VNode.prototype = {
	constructor: VNode,

	type:	null,

	vm:		null,

	// all this stuff can just live in attrs (as defined) just have getters here for it
	key:	null,
	ref:	null,
	data:	null,
	hooks:	null,
	ns:		null,

	el:		null,

	tag:	null,
	attrs:	null,
	body:	null,

	flags:	0,

	_class:	null,
	_diff:	null,

	// pending removal on promise resolution
	_dead:	false,
	// part of longest increasing subsequence?
	_lis:	false,

	idx:	null,
	parent:	null,

	/*
	// break out into optional fluent module
	key:	function(val) { this.key	= val; return this; },
	ref:	function(val) { this.ref	= val; return this; },		// deep refs
	data:	function(val) { this.data	= val; return this; },
	hooks:	function(val) { this.hooks	= val; return this; },		// h("div").hooks()
	html:	function(val) { this.html	= true; return this.body(val); },

	body:	function(val) { this.body	= val; return this; },
	*/
};

function defineText(body) {
	var node = new VNode;
	node.type = TEXT;
	node.body = body;
	return node;
}

// creates a one-shot self-ending stream that redraws target vm
// TODO: if it's already registered by any parent vm, then ignore to avoid simultaneous parent & child refresh

var tagCache = {};

var RE_ATTRS = /\[(\w+)(?:=(\w+))?\]/g;

function cssTag(raw) {
	{
		var cached = tagCache[raw];

		if (cached == null) {
			var tag, id, cls, attr;

			tagCache[raw] = cached = {
				tag:	(tag	= raw.match( /^[-\w]+/))		?	tag[0]						: "div",
				id:		(id		= raw.match( /#([-\w]+)/))		? 	id[1]						: null,
				class:	(cls	= raw.match(/\.([-\w.]+)/))		?	cls[1].replace(/\./g, " ")	: null,
				attrs:	null,
			};

			while (attr = RE_ATTRS.exec(raw)) {
				if (cached.attrs == null)
					{ cached.attrs = {}; }
				cached.attrs[attr[1]] = attr[2] || "";
			}
		}

		return cached;
	}
}

// (de)optimization flags

// forces slow bottom-up removeChild to fire deep willRemove/willUnmount hooks,
var DEEP_REMOVE = 1;
// prevents inserting/removing/reordering of children
var FIXED_BODY = 2;
// enables fast keyed lookup of children via binary search, expects homogeneous keyed body
var KEYED_LIST = 4;
// indicates an vnode match/diff/recycler function for body
var LAZY_LIST = 8;

function initElementNode(tag, attrs, body, flags) {
	var node = new VNode;

	node.type = ELEMENT;

	if (isSet(flags))
		{ node.flags = flags; }

	node.attrs = attrs;

	var parsed = cssTag(tag);

	node.tag = parsed.tag;

	// meh, weak assertion, will fail for id=0, etc.
	if (parsed.id || parsed.class || parsed.attrs) {
		var p = node.attrs || {};

		if (parsed.id && !isSet(p.id))
			{ p.id = parsed.id; }

		if (parsed.class) {
			node._class = parsed.class;		// static class
			p.class = parsed.class + (isSet(p.class) ? (" " + p.class) : "");
		}
		if (parsed.attrs) {
			for (var key in parsed.attrs)
				{ if (!isSet(p[key]))
					{ p[key] = parsed.attrs[key]; } }
		}

//		if (node.attrs !== p)
			node.attrs = p;
	}

	var mergedAttrs = node.attrs;

	if (isSet(mergedAttrs)) {
		if (isSet(mergedAttrs._key))
			{ node.key = mergedAttrs._key; }

		if (isSet(mergedAttrs._ref))
			{ node.ref = mergedAttrs._ref; }

		if (isSet(mergedAttrs._hooks))
			{ node.hooks = mergedAttrs._hooks; }

		if (isSet(mergedAttrs._data))
			{ node.data = mergedAttrs._data; }

		if (isSet(mergedAttrs._flags))
			{ node.flags = mergedAttrs._flags; }

		if (!isSet(node.key)) {
			if (isSet(node.ref))
				{ node.key = node.ref; }
			else if (isSet(mergedAttrs.id))
				{ node.key = mergedAttrs.id; }
			else if (isSet(mergedAttrs.name))
				{ node.key = mergedAttrs.name + (mergedAttrs.type === "radio" || mergedAttrs.type === "checkbox" ? mergedAttrs.value : ""); }
		}
	}

	if (body != null)
		{ node.body = body; }

	return node;
}

function setRef(vm, name, node) {
	var path = ["refs"].concat(name.split("."));
	deepSet(vm, path, node);
}

function setDeepRemove(node) {
	while (node = node.parent)
		{ node.flags |= DEEP_REMOVE; }
}

// vnew, vold
function preProc(vnew, parent, idx, ownVm) {
	if (vnew.type === VMODEL || vnew.type === VVIEW)
		{ return; }

	vnew.parent = parent;
	vnew.idx = idx;
	vnew.vm = ownVm;

	if (vnew.ref != null)
		{ setRef(getVm(vnew), vnew.ref, vnew); }

	var nh = vnew.hooks,
		vh = ownVm && ownVm.hooks;

	if (nh && (nh.willRemove || nh.didRemove) ||
		vh && (vh.willUnmount || vh.didUnmount))
		{ setDeepRemove(vnew); }

	if (isArr(vnew.body))
		{ preProcBody(vnew); }
	else {}
}

function preProcBody(vnew) {
	var body = vnew.body;

	for (var i = 0; i < body.length; i++) {
		var node2 = body[i];

		// remove false/null/undefined
		if (node2 === false || node2 == null)
			{ body.splice(i--, 1); }
		// flatten arrays
		else if (isArr(node2)) {
			insertArr(body, node2, i--, 1);
		}
		else {
			if (node2.type == null)
				{ body[i] = node2 = defineText(""+node2); }

			if (node2.type === TEXT) {
				// remove empty text nodes
				if (node2.body == null || node2.body === "")
					{ body.splice(i--, 1); }
				// merge with previous text node
				else if (i > 0 && body[i-1].type === TEXT) {
					body[i-1].body += node2.body;
					body.splice(i--, 1);
				}
				else
					{ preProc(node2, vnew, i, null); }
			}
			else
				{ preProc(node2, vnew, i, null); }
		}
	}
}

var unitlessProps = {
	animationIterationCount: true,
	boxFlex: true,
	boxFlexGroup: true,
	boxOrdinalGroup: true,
	columnCount: true,
	flex: true,
	flexGrow: true,
	flexPositive: true,
	flexShrink: true,
	flexNegative: true,
	flexOrder: true,
	gridRow: true,
	gridColumn: true,
	order: true,
	lineClamp: true,

	borderImageOutset: true,
	borderImageSlice: true,
	borderImageWidth: true,
	fontWeight: true,
	lineHeight: true,
	opacity: true,
	orphans: true,
	tabSize: true,
	widows: true,
	zIndex: true,
	zoom: true,

	fillOpacity: true,
	floodOpacity: true,
	stopOpacity: true,
	strokeDasharray: true,
	strokeDashoffset: true,
	strokeMiterlimit: true,
	strokeOpacity: true,
	strokeWidth: true
};

function autoPx(name, val) {
	{
		// typeof val === 'number' is faster but fails for numeric strings
		return !isNaN(val) && !unitlessProps[name] ? (val + "px") : val;
	}
}

// assumes if styles exist both are objects or both are strings
function patchStyle(n, o) {
	var ns =     (n.attrs || emptyObj).style;
	var os = o ? (o.attrs || emptyObj).style : null;

	// replace or remove in full
	if (ns == null || isVal(ns))
		{ n.el.style.cssText = ns; }
	else {
		for (var nn in ns) {
			var nv = ns[nn];

			if (os == null || nv != null && nv !== os[nn])
				{ n.el.style[nn] = autoPx(nn, nv); }
		}

		// clean old
		if (os) {
			for (var on in os) {
				if (ns[on] == null)
					{ n.el.style[on] = ""; }
			}
		}
	}
}

var didQueue = [];

function fireHook(hooks, name, o, n, immediate) {
	if (hooks != null) {
		var fn = o.hooks[name];

		if (fn) {
			if (name[0] === "d" && name[1] === "i" && name[2] === "d") {	// did*
				//	console.log(name + " should queue till repaint", o, n);
				immediate ? repaint(o.parent) && fn(o, n) : didQueue.push([fn, o, n]);
			}
			else {		// will*
				//	console.log(name + " may delay by promise", o, n);
				return fn(o, n);		// or pass  done() resolver
			}
		}
	}
}

function drainDidHooks(vm) {
	if (didQueue.length) {
		repaint(vm.node);

		var item;
		while (item = didQueue.shift())
			{ item[0](item[1], item[2]); }
	}
}

var doc = ENV_DOM ? document : null;

function closestVNode(el) {
	while (el._node == null)
		{ el = el.parentNode; }
	return el._node;
}

function createElement(tag, ns) {
	if (ns != null)
		{ return doc.createElementNS(ns, tag); }
	return doc.createElement(tag);
}

function createTextNode(body) {
	return doc.createTextNode(body);
}

function createComment(body) {
	return doc.createComment(body);
}

// ? removes if !recycled
function nextSib(sib) {
	return sib.nextSibling;
}

// ? removes if !recycled
function prevSib(sib) {
	return sib.previousSibling;
}

// TODO: this should collect all deep proms from all hooks and return Promise.all()
function deepNotifyRemove(node) {
	var vm = node.vm;

	var wuRes = vm != null && fireHook(vm.hooks, "willUnmount", vm, vm.data);

	var wrRes = fireHook(node.hooks, "willRemove", node);

	if ((node.flags & DEEP_REMOVE) === DEEP_REMOVE && isArr(node.body)) {
		for (var i = 0; i < node.body.length; i++)
			{ deepNotifyRemove(node.body[i]); }
	}

	return wuRes || wrRes;
}

function _removeChild(parEl, el, immediate) {
	var node = el._node, vm = node.vm;

	if (isArr(node.body)) {
		if ((node.flags & DEEP_REMOVE) === DEEP_REMOVE) {
			for (var i = 0; i < node.body.length; i++)
				{ _removeChild(el, node.body[i].el); }
		}
		else
			{ deepUnref(node); }
	}

	delete el._node;

	parEl.removeChild(el);

	fireHook(node.hooks, "didRemove", node, null, immediate);

	if (vm != null) {
		fireHook(vm.hooks, "didUnmount", vm, vm.data, immediate);
		vm.node = null;
	}
}

// todo: should delay parent unmount() by returning res prom?
function removeChild(parEl, el) {
	var node = el._node;

	// already marked for removal
	if (node._dead) { return; }

	var res = deepNotifyRemove(node);

	if (res != null && isProm(res)) {
		node._dead = true;
		res.then(curry(_removeChild, [parEl, el, true]));
	}
	else
		{ _removeChild(parEl, el); }
}

function deepUnref(node) {
	var obody = node.body;

	for (var i = 0; i < obody.length; i++) {
		var o2 = obody[i];
		delete o2.el._node;

		if (o2.vm != null)
			{ o2.vm.node = null; }

		if (isArr(o2.body))
			{ deepUnref(o2); }
	}
}

function clearChildren(parent) {
	var parEl = parent.el;

	if ((parent.flags & DEEP_REMOVE) === 0) {
		isArr(parent.body) && deepUnref(parent);
		parEl.textContent = null;
	}
	else {
		var el = parEl.firstChild;

		do {
			var next = nextSib(el);
			removeChild(parEl, el);
		} while (el = next);
	}
}

// todo: hooks
function insertBefore(parEl, el, refEl) {
	var node = el._node, inDom = el.parentNode != null;

	// el === refEl is asserted as a no-op insert called to fire hooks
	var vm = (el === refEl || !inDom) ? node.vm : null;

	if (vm != null)
		{ fireHook(vm.hooks, "willMount", vm, vm.data); }

	fireHook(node.hooks, inDom ? "willReinsert" : "willInsert", node);
	parEl.insertBefore(el, refEl);
	fireHook(node.hooks, inDom ? "didReinsert" : "didInsert", node);

	if (vm != null)
		{ fireHook(vm.hooks, "didMount", vm, vm.data); }
}

function insertAfter(parEl, el, refEl) {
	insertBefore(parEl, el, refEl ? nextSib(refEl) : null);
}

var onemit = {};

function emitCfg(cfg) {
	assignObj(onemit, cfg);
}

function emit(evName) {
	var targ = this,
		src = targ;

	var args = sliceArgs(arguments, 1).concat(src, src.data);

	do {
		var evs = targ.onemit;
		var fn = evs ? evs[evName] : null;

		if (fn) {
			fn.apply(targ, args);
			break;
		}
	} while (targ = targ.parent());

	if (onemit[evName])
		{ onemit[evName].apply(targ, args); }
}

var onevent = noop;

function config(newCfg) {
	onevent = newCfg.onevent || onevent;

	{
		if (newCfg.onemit)
			{ emitCfg(newCfg.onemit); }
	}

	
}

function bindEv(el, type, fn) {
	el[type] = fn;
}

function exec(fn, args, e, node, vm) {
	var out = fn.apply(vm, args.concat([e, node, vm, vm.data]));

	// should these respect out === false?
	vm.onevent(e, node, vm, vm.data, args);
	onevent.call(null, e, node, vm, vm.data, args);

	if (out === false) {
		e.preventDefault();
		e.stopPropagation();
	}
}

function handle(e) {
	var node = closestVNode(e.target);
	var vm = getVm(node);

	var evDef = e.currentTarget._node.attrs["on" + e.type], fn, args;

	if (isArr(evDef)) {
		fn = evDef[0];
		args = evDef.slice(1);
		exec(fn, args, e, node, vm);
	}
	else {
		for (var sel in evDef) {
			if (e.target.matches(sel)) {
				var evDef2 = evDef[sel];

				if (isArr(evDef2)) {
					fn = evDef2[0];
					args = evDef2.slice(1);
				}
				else {
					fn = evDef2;
					args = [];
				}

				exec(fn, args, e, node, vm);
			}
		}
	}
}

function patchEvent(node, name, nval, oval) {
	if (nval === oval)
		{ return; }

	var el = node.el;

	if (nval == null || isFunc(nval))
		{ bindEv(el, name, nval); }
	else if (oval == null)
		{ bindEv(el, name, handle); }
}

function remAttr(node, name, asProp) {
	if (name[0] === ".") {
		name = name.substr(1);
		asProp = true;
	}

	if (asProp)
		{ node.el[name] = ""; }
	else
		{ node.el.removeAttribute(name); }
}

// setAttr
// diff, ".", "on*", bool vals, skip _*, value/checked/selected selectedIndex
function setAttr(node, name, val, asProp, initial) {
	var el = node.el;

	if (val == null)
		{ !initial && remAttr(node, name, false); }		// will also removeAttr of style: null
	else if (node.ns != null)
		{ el.setAttribute(name, val); }
	else if (name === "class")
		{ el.className = val; }
	else if (name === "id" || typeof val === "boolean" || asProp)
		{ el[name] = val; }
	else if (name[0] === ".")
		{ el[name.substr(1)] = val; }
	else
		{ el.setAttribute(name, val); }
}

function patchAttrs(vnode, donor, initial) {
	var nattrs = vnode.attrs || emptyObj;
	var oattrs = donor.attrs || emptyObj;

	if (nattrs === oattrs) {
		
	}
	else {
		for (var key in nattrs) {
			var nval = nattrs[key];
			var isDyn = isDynProp(vnode.tag, key);
			var oval = isDyn ? vnode.el[key] : oattrs[key];

			if (nval === oval) {}
			else if (isStyleProp(key))
				{ patchStyle(vnode, donor); }
			else if (isSplProp(key)) {}
			else if (isEvProp(key))
				{ patchEvent(vnode, key, nval, oval); }
			else
				{ setAttr(vnode, key, nval, isDyn, initial); }
		}

		// TODO: bench style.cssText = "" vs removeAttribute("style")
		for (var key in oattrs) {
			!(key in nattrs) &&
			!isSplProp(key) &&
			remAttr(vnode, key, isDynProp(vnode.tag, key) || isEvProp(key));
		}
	}
}

function createView(view, data, key, opts) {
	if (view.type === VVIEW) {
		data	= view.data;
		key		= view.key;
		opts	= view.opts;
		view	= view.view;
	}

	return new ViewModel(view, data, key, opts);
}

//import { XML_NS, XLINK_NS } from './defineSvgElement';
function hydrateBody(vnode) {
	for (var i = 0; i < vnode.body.length; i++) {
		var vnode2 = vnode.body[i];
		var type2 = vnode2.type;

		// ELEMENT,TEXT,COMMENT
		if (type2 <= COMMENT)
			{ insertBefore(vnode.el, hydrate(vnode2)); }		// vnode.el.appendChild(hydrate(vnode2))
		else if (type2 === VVIEW) {
			var vm = createView(vnode2.view, vnode2.data, vnode2.key, vnode2.opts)._redraw(vnode, i, false);		// todo: handle new data updates
			type2 = vm.node.type;
			insertBefore(vnode.el, hydrate(vm.node));
		}
		else if (type2 === VMODEL) {
			var vm = vnode2.vm;
			vm._redraw(vnode, i);					// , false
			type2 = vm.node.type;
			insertBefore(vnode.el, vm.node.el);		// , hydrate(vm.node)
		}
	}
}

//  TODO: DRY this out. reusing normal patch here negatively affects V8's JIT
function hydrate(vnode, withEl) {
	if (vnode.el == null) {
		if (vnode.type === ELEMENT) {
			vnode.el = withEl || createElement(vnode.tag, vnode.ns);

		//	if (vnode.tag === "svg")
		//		vnode.el.setAttributeNS(XML_NS, 'xmlns:xlink', XLINK_NS);

			if (vnode.attrs != null)
				{ patchAttrs(vnode, emptyObj, true); }

			if ((vnode.flags & LAZY_LIST) === LAZY_LIST)	// vnode.body instanceof LazyList
				{ vnode.body.body(vnode); }

			if (isArr(vnode.body))
				{ hydrateBody(vnode); }
			else if (vnode.body != null && vnode.body !== "")
				{ vnode.el.textContent = vnode.body; }
		}
		else if (vnode.type === TEXT)
			{ vnode.el = withEl || createTextNode(vnode.body); }
		else if (vnode.type === COMMENT)
			{ vnode.el = withEl || createComment(vnode.body); }
	}

	vnode.el._node = vnode;

	return vnode.el;
}

// prevent GCC from inlining some large funcs (which negatively affects Chrome's JIT)
//window.syncChildren = syncChildren;
window.lisMove = lisMove;

function nextNode(node, body) {
	return body[node.idx + 1];
}

function prevNode(node, body) {
	return body[node.idx - 1];
}

function parentNode(node) {
	return node.parent;
}

var BREAK = 1;
var BREAK_ALL = 2;

function syncDir(advSib, advNode, insert, sibName, nodeName, invSibName, invNodeName, invInsert) {
	return function(node, parEl, body, state, convTest, lis) {
		var sibNode, tmpSib;

		if (state[sibName] != null) {
			// skip dom elements not created by domvm
			if ((sibNode = state[sibName]._node) == null) {
				state[sibName] = advSib(state[sibName]);
				return;
			}

			if (parentNode(sibNode) !== node) {
				tmpSib = advSib(state[sibName]);
				sibNode.vm != null ? sibNode.vm.unmount(true) : removeChild(parEl, state[sibName]);
				state[sibName] = tmpSib;
				return;
			}
		}

		if (state[nodeName] == convTest)
			{ return BREAK_ALL; }
		else if (state[nodeName].el == null) {
			insert(parEl, hydrate(state[nodeName]), state[sibName]);	// should lis be updated here?
			state[nodeName] = advNode(state[nodeName], body);		// also need to advance sib?
		}
		else if (state[nodeName].el === state[sibName]) {
			state[nodeName] = advNode(state[nodeName], body);
			state[sibName] = advSib(state[sibName]);
		}
		// head->tail or tail->head
		else if (!lis && sibNode === state[invNodeName]) {
			tmpSib = state[sibName];
			state[sibName] = advSib(tmpSib);
			invInsert(parEl, tmpSib, state[invSibName]);
			state[invSibName] = tmpSib;
		}
		else {
			if (lis && state[sibName] != null)
				{ return lisMove(advSib, advNode, insert, sibName, nodeName, parEl, body, sibNode, state); }

			return BREAK;
		}
	};
}

function lisMove(advSib, advNode, insert, sibName, nodeName, parEl, body, sibNode, state) {
	if (sibNode._lis) {
		insert(parEl, state[nodeName].el, state[sibName]);
		state[nodeName] = advNode(state[nodeName], body);
	}
	else {
		// find closest tomb
		var t = binaryFindLarger(sibNode.idx, state.tombs);
		sibNode._lis = true;
		var tmpSib = advSib(state[sibName]);
		insert(parEl, state[sibName], t != null ? body[state.tombs[t]].el : t);

		if (t == null)
			{ state.tombs.push(sibNode.idx); }
		else
			{ state.tombs.splice(t, 0, sibNode.idx); }

		state[sibName] = tmpSib;
	}
}

var syncLft = syncDir(nextSib, nextNode, insertBefore, "lftSib", "lftNode", "rgtSib", "rgtNode", insertAfter);
var syncRgt = syncDir(prevSib, prevNode, insertAfter, "rgtSib", "rgtNode", "lftSib", "lftNode", insertBefore);

function syncChildren(node, donor) {
	var obody	= donor.body,
		parEl	= node.el,
		body	= node.body,
		state = {
			lftNode:	body[0],
			rgtNode:	body[body.length - 1],
			lftSib:		((obody)[0] || emptyObj).el,
			rgtSib:		(obody[obody.length - 1] || emptyObj).el,
		};

	converge:
	while (1) {
//		from_left:
		while (1) {
			var l = syncLft(node, parEl, body, state, null, false);
			if (l === BREAK) { break; }
			if (l === BREAK_ALL) { break converge; }
		}

//		from_right:
		while (1) {
			var r = syncRgt(node, parEl, body, state, state.lftNode, false);
			if (r === BREAK) { break; }
			if (r === BREAK_ALL) { break converge; }
		}

		sortDOM(node, parEl, body, state);
		break;
	}
}

// TODO: also use the state.rgtSib and state.rgtNode bounds, plus reduce LIS range
function sortDOM(node, parEl, body, state) {
	var kids = Array.prototype.slice.call(parEl.childNodes);
	var domIdxs = [];

	for (var k = 0; k < kids.length; k++) {
		var n = kids[k]._node;

		if (n.parent === node)
			{ domIdxs.push(n.idx); }
	}

	// list of non-movable vnode indices (already in correct order in old dom)
	var tombs = longestIncreasingSubsequence(domIdxs).map(function (i) { return domIdxs[i]; });

	for (var i = 0; i < tombs.length; i++)
		{ body[tombs[i]]._lis = true; }

	state.tombs = tombs;

	while (1) {
		var r = syncLft(node, parEl, body, state, null, true);
		if (r === BREAK_ALL) { break; }
	}
}

function alreadyAdopted(vnode) {
	return vnode.el._node.parent !== vnode.parent;
}

function takeSeqIndex(n, obody, fromIdx) {
	return obody[fromIdx];
}

function findSeqThorough(n, obody, fromIdx) {		// pre-tested isView?
	for (; fromIdx < obody.length; fromIdx++) {
		var o = obody[fromIdx];

		if (o.vm != null) {
			// match by key & viewFn || vm
			if (n.type === VVIEW && o.vm.view === n.view && o.vm.key === n.key || n.type === VMODEL && o.vm === n.vm)
				{ return o; }
		}
		else if (!alreadyAdopted(o) && n.tag === o.tag && n.type === o.type && n.key === o.key && (n.flags & ~DEEP_REMOVE) === (o.flags & ~DEEP_REMOVE))
			{ return o; }
	}

	return null;
}

function findHashKeyed(n, obody, fromIdx) {
	return obody[obody._keys[n.key]];
}

/*
// list must be a sorted list of vnodes by key
function findBinKeyed(n, list) {
	var idx = binaryKeySearch(list, n.key);
	return idx > -1 ? list[idx] : null;
}
*/

// have it handle initial hydrate? !donor?
// types (and tags if ELEM) are assumed the same, and donor exists
function patch(vnode, donor) {
	fireHook(donor.hooks, "willRecycle", donor, vnode);

	var el = vnode.el = donor.el;

	var obody = donor.body;
	var nbody = vnode.body;

	el._node = vnode;

	// "" => ""
	if (vnode.type === TEXT && nbody !== obody) {
		el.nodeValue = nbody;
		return;
	}

	if (vnode.attrs != null || donor.attrs != null)
		{ patchAttrs(vnode, donor, false); }

	// patch events

	var oldIsArr = isArr(obody);
	var newIsArr = isArr(nbody);
	var lazyList = (vnode.flags & LAZY_LIST) === LAZY_LIST;

//	var nonEqNewBody = nbody != null && nbody !== obody;

	if (oldIsArr) {
		// [] => []
		if (newIsArr || lazyList)
			{ patchChildren(vnode, donor); }
		// [] => "" | null
		else if (nbody !== obody) {
			if (nbody != null)
				{ el.textContent = nbody; }
			else
				{ clearChildren(donor); }
		}
	}
	else {
		// "" | null => []
		if (newIsArr) {
			clearChildren(donor);
			hydrateBody(vnode);
		}
		// "" | null => "" | null
		else if (nbody !== obody) {
			if (el.firstChild)
				{ el.firstChild.nodeValue = nbody; }
			else
				{ el.textContent = nbody; }
		}
	}

	fireHook(donor.hooks, "didRecycle", donor, vnode);
}

// larger qtys of KEYED_LIST children will use binary search
//const SEQ_FAILS_MAX = 100;

// TODO: modify vtree matcher to work similar to dom reconciler for keyed from left -> from right -> head/tail -> binary
// fall back to binary if after failing nri - nli > SEQ_FAILS_MAX
// while-advance non-keyed fromIdx
// [] => []
function patchChildren(vnode, donor) {
	var nbody		= vnode.body,
		nlen		= nbody.length,
		obody		= donor.body,
		olen		= obody.length,
		isLazy		= (vnode.flags & LAZY_LIST) === LAZY_LIST,
		isFixed		= (vnode.flags & FIXED_BODY) === FIXED_BODY,
		isKeyed		= (vnode.flags & KEYED_LIST) === KEYED_LIST,
		domSync		= !isFixed && vnode.type === ELEMENT,
		doFind		= true,
		find		= (
			isKeyed ? findHashKeyed :				// keyed lists/lazyLists
			isFixed || isLazy ? takeSeqIndex :		// unkeyed lazyLists and FIXED_BODY
			findSeqThorough							// more complex stuff
		);

	if (isKeyed) {
		var keys = {};
		for (var i = 0; i < obody.length; i++)
			{ keys[obody[i].key] = i; }
		obody._keys = keys;
	}

	if (domSync && nlen === 0) {
		clearChildren(donor);
		if (isLazy)
			{ vnode.body = []; }	// nbody.tpl(all);
		return;
	}

	var donor2,
		node2,
		foundIdx,
		patched = 0,
		everNonseq = false,
		fromIdx = 0;		// first unrecycled node (search head)

	if (isLazy) {
		var fnode2 = {key: null};
		var nbodyNew = Array(nlen);
	}

	for (var i = 0; i < nlen; i++) {
		if (isLazy) {
			var remake = false;
			var diffRes = null;

			if (doFind) {
				if (isKeyed)
					{ fnode2.key = nbody.key(i); }

				donor2 = find(fnode2, obody, fromIdx);
			}

			if (donor2 != null) {
                foundIdx = donor2.idx;
				diffRes = nbody.diff(i, donor2);

				// diff returns same, so cheaply adopt vnode without patching
				if (diffRes === true) {
					node2 = donor2;
					node2.parent = vnode;
					node2.idx = i;
					node2._lis = false;
				}
				// diff returns new diffVals, so generate new vnode & patch
				else
					{ remake = true; }
			}
			else
				{ remake = true; }

			if (remake) {
				node2 = nbody.tpl(i);			// what if this is a VVIEW, VMODEL, injected element?
				preProc(node2, vnode, i);

				node2._diff = diffRes != null ? diffRes : nbody.diff(i);

				if (donor2 != null)
					{ patch(node2, donor2); }
			}
			else {
				// TODO: flag tmp FIXED_BODY on unchanged nodes?

				// domSync = true;		if any idx changes or new nodes added/removed
			}

			nbodyNew[i] = node2;
		}
		else {
			var node2 = nbody[i];
			var type2 = node2.type;

			// ELEMENT,TEXT,COMMENT
			if (type2 <= COMMENT) {
				if (donor2 = doFind && find(node2, obody, fromIdx)) {
					patch(node2, donor2);
					foundIdx = donor2.idx;
				}
			}
			else if (type2 === VVIEW) {
				if (donor2 = doFind && find(node2, obody, fromIdx)) {		// update/moveTo
					foundIdx = donor2.idx;
					var vm = donor2.vm._update(node2.data, vnode, i);		// withDOM
				}
				else
					{ var vm = createView(node2.view, node2.data, node2.key, node2.opts)._redraw(vnode, i, false); }	// createView, no dom (will be handled by sync below)

				type2 = vm.node.type;
			}
			else if (type2 === VMODEL) {
				// if the injected vm has never been rendered, this vm._update() serves as the
				// initial vtree creator, but must avoid hydrating (creating .el) because syncChildren()
				// which is responsible for mounting below (and optionally hydrating), tests .el presence
				// to determine if hydration & mounting are needed
				var withDOM = isHydrated(node2.vm);

				var vm = node2.vm._update(node2.data, vnode, i, withDOM);
				type2 = vm.node.type;
			}
		}

		// found donor & during a sequential search ...at search head
		if (!isKeyed && donor2 != null) {
			if (foundIdx === fromIdx) {
				// advance head
				fromIdx++;
				// if all old vnodes adopted and more exist, stop searching
				if (fromIdx === olen && nlen > olen) {
					// short-circuit find, allow loop just create/init rest
					donor2 = null;
					doFind = false;
				}
			}
			else
				{ everNonseq = true; }

			if (olen > 100 && everNonseq && ++patched % 10 === 0)
				{ while (fromIdx < olen && alreadyAdopted(obody[fromIdx]))
					{ fromIdx++; } }
		}
	}

	// replace List w/ new body
	if (isLazy)
		{ vnode.body = nbodyNew; }

	domSync && syncChildren(vnode, donor);
}

// view + key serve as the vm's unique identity
function ViewModel(view, data, key, opts) {
	var vm = this;

	vm.view = view;
	vm.data = data;
	vm.key = key;

	if (opts) {
		vm.opts = opts;
		vm.config(opts);
	}

	var out = isPlainObj(view) ? view : view.call(vm, vm, data, key, opts);

	if (isFunc(out))
		{ vm.render = out; }
	else {
		vm.render = out.render;
		vm.config(out);
	}

	// these must be wrapped here since they're debounced per view
	vm._redrawAsync = raft(function (_) { return vm.redraw(true); });
	vm._updateAsync = raft(function (newData) { return vm.update(newData, true); });

	vm.init && vm.init.call(vm, vm, vm.data, vm.key, opts);
}

var ViewModelProto = ViewModel.prototype = {
	constructor: ViewModel,

	_diff:	null,	// diff cache

	init:	null,
	view:	null,
	key:	null,
	data:	null,
	state:	null,
	api:	null,
	opts:	null,
	node:	null,
	hooks:	null,
	onevent: noop,
	refs:	null,
	render:	null,

	mount: mount,
	unmount: unmount,
	config: function(opts) {
		var t = this;

		if (opts.init)
			{ t.init = opts.init; }
		if (opts.diff)
			{ t.diff = opts.diff; }
		if (opts.onevent)
			{ t.onevent = opts.onevent; }

		// maybe invert assignment order?
		if (opts.hooks)
			{ t.hooks = assignObj(t.hooks || {}, opts.hooks); }

		{
			if (opts.onemit)
				{ t.onemit = assignObj(t.onemit || {}, opts.onemit); }
		}
	},
	parent: function() {
		return getVm(this.node.parent);
	},
	root: function() {
		var p = this.node;

		while (p.parent)
			{ p = p.parent; }

		return p.vm;
	},
	redraw: function(sync) {
		var vm = this;
		sync ? vm._redraw(null, null, isHydrated(vm)) : vm._redrawAsync();
		return vm;
	},
	update: function(newData, sync) {
		var vm = this;
		sync ? vm._update(newData, null, null, isHydrated(vm)) : vm._updateAsync(newData);
		return vm;
	},

	_update: updateSync,
	_redraw: redrawSync,
	_redrawAsync: null,
	_updateAsync: null,
};

function mount(el, isRoot) {
	var vm = this;

	if (isRoot) {
		clearChildren({el: el, flags: 0});

		vm._redraw(null, null, false);

		// if placeholder node doesnt match root tag
		if (el.nodeName.toLowerCase() !== vm.node.tag) {
			hydrate(vm.node);
			insertBefore(el.parentNode, vm.node.el, el);
			el.parentNode.removeChild(el);
		}
		else
			{ insertBefore(el.parentNode, hydrate(vm.node, el), el); }
	}
	else {
		vm._redraw(null, null);

		if (el)
			{ insertBefore(el, vm.node.el); }
	}

	if (el)
		{ drainDidHooks(vm); }

	return vm;
}

// asSub means this was called from a sub-routine, so don't drain did* hook queue
function unmount(asSub) {
	var vm = this;

	var node = vm.node;
	var parEl = node.el.parentNode;

	// edge bug: this could also be willRemove promise-delayed; should .then() or something to make sure hooks fire in order
	removeChild(parEl, node.el);

	if (!asSub)
		{ drainDidHooks(vm); }
}

function reParent(vm, vold, newParent, newIdx) {
	if (newParent != null) {
		newParent.body[newIdx] = vold;
		vold.idx = newIdx;
		vold.parent = newParent;
		vold._lis = false;
	}
	return vm;
}

function redrawSync(newParent, newIdx, withDOM) {
	var isRedrawRoot = newParent == null;
	var vm = this;
	var isMounted = vm.node && vm.node.el && vm.node.el.parentNode;

	var vold = vm.node, oldDiff, newDiff;

	if (vm.diff != null) {
		oldDiff = vm._diff;
		vm._diff = newDiff = vm.diff(vm, vm.data);

		if (vold != null) {
			var cmpFn = isArr(oldDiff) ? cmpArr : cmpObj;
			var isSame = oldDiff === newDiff || cmpFn(oldDiff, newDiff);

			if (isSame)
				{ return reParent(vm, vold, newParent, newIdx); }
		}
	}

	isMounted && fireHook(vm.hooks, "willRedraw", vm, vm.data);

	var vnew = vm.render.call(vm, vm, vm.data, oldDiff, newDiff);

	if (vnew === vold)
		{ return reParent(vm, vold, newParent, newIdx); }

	// todo: test result of willRedraw hooks before clearing refs
	vm.refs = null;

	// always assign vm key to root vnode (this is a de-opt)
	if (vm.key != null && vnew.key !== vm.key)
		{ vnew.key = vm.key; }

	vm.node = vnew;

	if (newParent) {
		preProc(vnew, newParent, newIdx, vm);
		newParent.body[newIdx] = vnew;
	}
	else if (vold && vold.parent) {
		preProc(vnew, vold.parent, vold.idx, vm);
		vold.parent.body[vold.idx] = vnew;
	}
	else
		{ preProc(vnew, null, null, vm); }

	if (withDOM !== false) {
		if (vold) {
			// root node replacement
			if (vold.tag !== vnew.tag || vold.key !== vnew.key) {
				// hack to prevent the replacement from triggering mount/unmount
				vold.vm = vnew.vm = null;

				var parEl = vold.el.parentNode;
				var refEl = nextSib(vold.el);
				removeChild(parEl, vold.el);
				insertBefore(parEl, hydrate(vnew), refEl);

				// another hack that allows any higher-level syncChildren to set
				// reconciliation bounds using a live node
				vold.el = vnew.el;

				// restore
				vnew.vm = vm;
			}
			else
				{ patch(vnew, vold); }
		}
		else
			{ hydrate(vnew); }
	}

	isMounted && fireHook(vm.hooks, "didRedraw", vm, vm.data);

	if (isRedrawRoot && isMounted)
		{ drainDidHooks(vm); }

	return vm;
}

// this also doubles as moveTo
// TODO? @withRedraw (prevent redraw from firing)
function updateSync(newData, newParent, newIdx, withDOM) {
	var vm = this;

	if (newData != null) {
		if (vm.data !== newData) {
			fireHook(vm.hooks, "willUpdate", vm, newData);
			vm.data = newData;

			
		}
	}

	return vm._redraw(newParent, newIdx, withDOM);
}

function defineElement(tag, arg1, arg2, flags) {
	var attrs, body;

	if (arg2 == null) {
		if (isPlainObj(arg1))
			{ attrs = arg1; }
		else
			{ body = arg1; }
	}
	else {
		attrs = arg1;
		body = arg2;
	}

	return initElementNode(tag, attrs, body, flags);
}

//export const XML_NS = "http://www.w3.org/2000/xmlns/";
var SVG_NS = "http://www.w3.org/2000/svg";

function defineSvgElement(tag, arg1, arg2, flags) {
	var n = defineElement(tag, arg1, arg2, flags);
	n.ns = SVG_NS;
	return n;
}

function defineComment(body) {
	var node = new VNode;
	node.type = COMMENT;
	node.body = body;
	return node;
}

// placeholder for declared views
function VView(view, data, key, opts) {
	this.view = view;
	this.data = data;
	this.key = key;
	this.opts = opts;
}

VView.prototype = {
	constructor: VView,

	type: VVIEW,
	view: null,
	data: null,
	key: null,
	opts: null,
};

function defineView(view, data, key, opts) {
	return new VView(view, data, key, opts);
}

// placeholder for injected ViewModels
function VModel(vm) {
	this.vm = vm;
}

VModel.prototype = {
	constructor: VModel,

	type: VMODEL,
	vm: null,
};

function injectView(vm) {
//	if (vm.node == null)
//		vm._redraw(null, null, false);

//	return vm.node;

	return new VModel(vm);
}

function injectElement(el) {
	var node = new VNode;
	node.type = ELEMENT;
	node.el = node.key = el;
	return node;
}

function lazyList(items, cfg) {
	var len = items.length;

	var self = {
		items: items,
		length: len,
		// defaults to returning item identity (or position?)
		key: function(i) {
			return cfg.key(items[i], i);
		},
		// default returns 0?
		diff: function(i, donor) {
			var newVals = cfg.diff(items[i], i);
			if (donor == null)
				{ return newVals; }
			var oldVals = donor._diff;
			var same = newVals === oldVals || isArr(oldVals) ? cmpArr(newVals, oldVals) : cmpObj(newVals, oldVals);
			return same || newVals;
		},
		tpl: function(i) {
			return cfg.tpl(items[i], i);
		},
		map: function(tpl) {
			cfg.tpl = tpl;
			return self;
		},
		body: function(vnode) {
			var nbody = Array(len);

			for (var i = 0; i < len; i++) {
				var vnode2 = self.tpl(i);

			//	if ((vnode.flags & KEYED_LIST) === KEYED_LIST && self. != null)
			//		vnode2.key = getKey(item);

				vnode2._diff = self.diff(i);			// holds oldVals for cmp

				nbody[i] = vnode2;

				// run preproc pass (should this be just preProc in above loop?) bench
				preProc(vnode2, vnode, i);
			}

			// replace List with generated body
			vnode.body = nbody;
		}
	};

	return self;
}

var nano = {
	config: config,

	ViewModel: ViewModel,
	VNode: VNode,

	createView: createView,

	defineElement: defineElement,
	defineSvgElement: defineSvgElement,
	defineText: defineText,
	defineComment: defineComment,
	defineView: defineView,

	injectView: injectView,
	injectElement: injectElement,

	lazyList: lazyList,

	FIXED_BODY: FIXED_BODY,
	DEEP_REMOVE: DEEP_REMOVE,
	KEYED_LIST: KEYED_LIST,
	LAZY_LIST: LAZY_LIST,
};

function protoPatch(n, doRepaint) {
	patch$1(this, n, doRepaint);
}

// newNode can be either {class: style: } or full new VNode
// will/didPatch hooks?
function patch$1(o, n, doRepaint) {
	if (n.type != null) {
		// no full patching of view roots, just use redraw!
		if (o.vm != null)
			{ return; }

		preProc(n, o.parent, o.idx, null);
		o.parent.body[o.idx] = n;
		patch(n, o);
		doRepaint && repaint(n);
		drainDidHooks(getVm(n));
	}
	else {
		// TODO: re-establish refs

		// shallow-clone target
		var donor = Object.create(o);
		// fixate orig attrs
		donor.attrs = assignObj({}, o.attrs);
		// assign new attrs into live targ node
		var oattrs = assignObj(o.attrs, n);
		// prepend any fixed shorthand class
		if (o._class != null) {
			var aclass = oattrs.class;
			oattrs.class = aclass != null && aclass !== "" ? o._class + " " + aclass : o._class;
		}

		patchAttrs(o, donor);

		doRepaint && repaint(o);
	}
}

VNodeProto.patch = protoPatch;

function nextSubVms(n, accum) {
	var body = n.body;

	if (isArr(body)) {
		for (var i = 0; i < body.length; i++) {
			var n2 = body[i];

			if (n2.vm != null)
				{ accum.push(n2.vm); }
			else
				{ nextSubVms(n2, accum); }
		}
	}

	return accum;
}

function defineElementSpread(tag) {
	var args = arguments;
	var len = args.length;
	var body, attrs;

	if (len > 1) {
		var bodyIdx = 1;

		if (isPlainObj(args[1])) {
			attrs = args[1];
			bodyIdx = 2;
		}

		if (len === bodyIdx + 1 && (isVal(args[bodyIdx]) || isArr(args[bodyIdx]) || attrs && (attrs._flags & LAZY_LIST) === LAZY_LIST))
			{ body = args[bodyIdx]; }
		else
			{ body = sliceArgs(args, bodyIdx); }
	}

	return initElementNode(tag, attrs, body);
}

function defineSvgElementSpread() {
	var n = defineElementSpread.apply(null, arguments);
	n.ns = SVG_NS;
	return n;
}

ViewModelProto.emit = emit;
ViewModelProto.onemit = null;

ViewModelProto.body = function() {
	return nextSubVms(this.node, []);
};

nano.defineElementSpread = defineElementSpread;
nano.defineSvgElementSpread = defineSvgElementSpread;

return nano;

})));
//# sourceMappingURL=domvm.micro.js.map


/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = __webpack_require__(3);
var dom_1 = __webpack_require__(0);
var html_1 = __webpack_require__(1);
var ScrollView = /** @class */ (function () {
    function ScrollView(getRootView, config) {
        var _a;
        if (config === void 0) { config = {}; }
        var _this = this;
        this.config = core_1.extend({
            speed: 20
        }, config);
        this._wheelName = html_1.isIE() ? "onmousewheel" : "onwheel";
        this._getRootView = getRootView;
        this._scrollTop = 0;
        this._runnerTop = 0;
        this._runnerHeight = 0;
        this._visibleArea = 1;
        this._scrollWidth = html_1.getScrollbarWidth();
        this._handlers = (_a = {
                onscroll: function () {
                    _this._update();
                }
            },
            _a[this._wheelName] = function (e) {
                e.preventDefault();
                var sign = (e.deltaY || -e.wheelDelta) > 0 ? 1 : -1;
                var delta = sign * _this.config.speed;
                var area = _this._getRefs().area;
                var maxBottom = area.scrollHeight - _this._runnerHeight;
                var newScrollTop = _this._scrollTop + delta;
                if (newScrollTop < 0) {
                    area.scrollTop = 0;
                }
                else if (newScrollTop > maxBottom) {
                    area.scrollTop = maxBottom;
                }
                else {
                    area.scrollTop = newScrollTop;
                }
                _this._update();
            },
            _a.onmousedownRunner = function (mouseDownEv) {
                mouseDownEv.preventDefault();
                var _a = _this._getRefs(), area = _a.area, runner = _a.runner;
                var rect = area.getBoundingClientRect();
                var top = rect.top + window.pageYOffset;
                var bottom = rect.bottom + window.pageYOffset;
                var maxBottom = area.scrollHeight - _this._runnerHeight;
                var delta = mouseDownEv.pageY - runner.getBoundingClientRect().top - window.pageYOffset;
                var mouseMove = function (e) {
                    var y = e.pageY - delta;
                    if (y <= top) {
                        area.scrollTop = 0;
                    }
                    else if (y > bottom) {
                        area.scrollTop = maxBottom;
                    }
                    else {
                        area.scrollTop = (y - top) / _this._visibleArea;
                    }
                    _this._update();
                };
                var mouseUp = function () {
                    document.removeEventListener("mousemove", mouseMove);
                    document.removeEventListener("mouseup", mouseUp);
                    document.body.classList.remove("dhx-no-select");
                };
                document.body.classList.add("dhx-no-select");
                document.addEventListener("mousemove", mouseMove);
                document.addEventListener("mouseup", mouseUp);
            },
            _a.onmousedownTrack = function (e) {
                if (e.target.classList.contains("scroll-runner")) {
                    return;
                }
                e.preventDefault();
                var mouseUp = function () {
                    document.removeEventListener("mouseup", mouseUp);
                    window.clearInterval(mousePressed); // typescript bug
                };
                var area = _this._getRefs().area;
                var top = e.target.getBoundingClientRect().top + window.pageYOffset;
                var maxBottom = area.scrollHeight - _this._runnerHeight;
                var y = e.pageY;
                var updateScroll = function () {
                    var scrollTop;
                    if (y < top + _this._runnerTop) {
                        scrollTop = _this._scrollTop - area.clientHeight;
                        if (scrollTop < 0) {
                            scrollTop = 0;
                        }
                    }
                    else if (y > top + _this._runnerTop + _this._runnerHeight) {
                        scrollTop = _this._scrollTop + area.clientHeight;
                        if (scrollTop > maxBottom) {
                            scrollTop = maxBottom;
                        }
                    }
                    else {
                        return;
                    }
                    area.scrollTop = scrollTop;
                    _this._update();
                };
                updateScroll();
                var mousePressed = setInterval(updateScroll, 100);
                document.addEventListener("mouseup", mouseUp);
            },
            _a);
    }
    ScrollView.prototype.render = function (element) {
        var _this = this;
        var _a;
        if (this._scrollWidth === 0) {
            return element;
        }
        return dom_1.el(".scroll-view-wrapper", {
            style: {
                width: "100%",
                height: "100%",
                overflow: "hidden",
                position: "relative"
            }
        }, [
            dom_1.el(".scroll-view", {
                onscroll: this._handlers.onscroll,
                _ref: "scroll-view",
                _hooks: {
                    didInsert: function () {
                        _this._update();
                    },
                    didRecycle: function () {
                        _this._update();
                    }
                },
                style: {
                    "height": "100%",
                    "width": "calc(100% + " + this._scrollWidth + "px)",
                    "overflowY": "scroll",
                    "-ms-overflow-style": "scrollbar"
                },
            }, [element]),
            dom_1.el(".y-scroll", (_a = {
                    onmousedown: this._handlers.onmousedownTrack
                },
                _a[this._wheelName] = this._handlers[this._wheelName],
                _a.style = {
                    width: "10px",
                    height: "100%",
                    right: 0,
                    top: 0,
                    position: "absolute"
                },
                _a), [
                dom_1.el(".scroll-runner", {
                    _ref: "scroll-runner",
                    onmousedown: this._handlers.onmousedownRunner,
                    style: {
                        height: this._runnerHeight + "px",
                        right: "2px",
                        top: this._runnerTop,
                        width: "6px",
                        position: "absolute"
                    }
                })
            ])
        ]);
    };
    ScrollView.prototype._update = function () {
        var refs = this._getRefs();
        if (!refs) {
            return;
        }
        var area = refs.area, runner = refs.runner;
        this._visibleArea = area.clientHeight / area.scrollHeight;
        this._scrollTop = area.scrollTop;
        this._runnerTop = this._scrollTop * this._visibleArea;
        if (this._visibleArea < 1) {
            this._runnerHeight = area.clientHeight * this._visibleArea;
        }
        else {
            this._runnerHeight = 0;
        }
        // update dom
        runner.style.top = this._runnerTop + "px";
        runner.style.height = this._runnerHeight + "px";
    };
    ScrollView.prototype._getRefs = function () {
        var rootView = this._getRootView();
        if (rootView.refs && rootView.refs["scroll-view"] && rootView.refs["scroll-runner"]) {
            return {
                area: rootView.refs["scroll-view"].el,
                runner: rootView.refs["scroll-runner"].el
            };
        }
    };
    return ScrollView;
}());
exports.ScrollView = ScrollView;


/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(46));


/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Cell_1 = __webpack_require__(47);
var dom_1 = __webpack_require__(0);
var Layout = /** @class */ (function (_super) {
    __extends(Layout, _super);
    function Layout(parent, config) {
        var _this = _super.call(this, parent, config) || this;
        if (_this.config.views) {
            _this.config.activeView = _this.config.activeView || 0;
            _this._isViewLayout = true;
        }
        _this._all = {};
        _this._parseConfig();
        _this._css += _this._xLayout ? "layout_x" : "layout_y";
        if (!(parent instanceof Layout)) {
            var view = dom_1.create({ render: function () { return _this.toVDOM(); } }, _this);
            _this.mount(parent, view);
        }
        return _this;
    }
    Layout.prototype.cell = function (id) {
        return this._all[id];
    };
    Layout.prototype.updateActiveView = function (id) {
        for (var i = 0; i < this._cells.length; i++) {
            if (this._cells[i].id === id) {
                if (this.config.activeView !== i) {
                    this.config.activeView = i;
                    this.paint();
                }
                return;
            }
        }
    };
    Layout.prototype.getActiveView = function () {
        return this._cells[this.config.activeView];
    };
    Layout.prototype.toVDOM = function () {
        if (this._isViewLayout) {
            return _super.prototype.toVDOM.call(this, [this.getActiveView().toVDOM()]);
        }
        var nodes = [];
        this._cells.forEach(function (cell) {
            var node = cell.toVDOM();
            if (Array.isArray(node)) {
                nodes.push.apply(nodes, node);
            }
            else {
                nodes.push(node);
            }
        });
        return _super.prototype.toVDOM.call(this, nodes, this._isTopParent);
    };
    Layout.prototype.removeCell = function (id) {
        var topParent = this.getTopParent();
        if (topParent._all[id]) {
            var parent_1 = topParent._all[id].getParent();
            delete topParent._all[id];
            var cells = parent_1._cells;
            var deleteIndex = -1;
            for (var i = 0; i < cells.length; i++) {
                if (cells[i].id === id) {
                    deleteIndex = i;
                    break;
                }
            }
            if (deleteIndex !== -1) {
                cells.splice(deleteIndex, 1);
            }
            this.paint();
        }
    };
    Layout.prototype.addCell = function (config, index) {
        if (index === void 0) { index = -1; }
        var topParent = this.getTopParent();
        var view = this._parseView(config, topParent);
        if (index < 0) {
            index = this._cells.length + index + 1;
        }
        this._cells.splice(index, 0, view);
        this.paint();
    };
    Layout.prototype.getId = function (index) {
        if (index < 0) {
            index = this._cells.length + index;
        }
        return this._cells[index] ? this._cells[index].id : undefined;
    };
    Layout.prototype._parseConfig = function () {
        var _this = this;
        var config = this.config;
        var topParent = this.getTopParent();
        var cells = config.rows || config.cols || config.views;
        this._xLayout = !config.rows;
        this._cells = cells.map(function (a) { return _this._parseView(a, topParent); });
    };
    Layout.prototype._createUi = function (cell) {
        if (cell.rows || cell.cols || cell.views) {
            return new Layout(this, cell);
        }
        else {
            return new Cell_1.Cell(this, cell);
        }
    };
    Layout.prototype._parseView = function (raw, topParent) {
        var view = this._createUi(raw);
        if (raw.id) {
            topParent._all[raw.id] = view;
        }
        return view;
    };
    return Layout;
}(Cell_1.Cell));
exports.Layout = Layout;


/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = __webpack_require__(0);
var view_1 = __webpack_require__(12);
var resizeMode;
(function (resizeMode) {
    resizeMode[resizeMode["unknown"] = 0] = "unknown";
    resizeMode[resizeMode["percents"] = 1] = "percents";
    resizeMode[resizeMode["pixels"] = 2] = "pixels";
    resizeMode[resizeMode["mixedpx1"] = 3] = "mixedpx1";
    resizeMode[resizeMode["mixedpx2"] = 4] = "mixedpx2";
    resizeMode[resizeMode["mixedperc1"] = 5] = "mixedperc1";
    resizeMode[resizeMode["mixedperc2"] = 6] = "mixedperc2";
})(resizeMode || (resizeMode = {}));
function getResizeMode(dir, conf1, conf2) {
    var field = dir ? "width" : "height";
    var is1perc = conf1[field] && conf1[field].indexOf("%") !== -1;
    var is2perc = conf2[field] && conf2[field].indexOf("%") !== -1;
    var is1px = conf1[field] && conf1[field].indexOf("px") !== -1;
    var is2px = conf2[field] && conf2[field].indexOf("px") !== -1;
    if (is1perc && is2perc) {
        return resizeMode.percents;
    }
    if (is1px && is2px) {
        return resizeMode.pixels;
    }
    if (is1px && !is2px) {
        return resizeMode.mixedpx1;
    }
    if (is2px && !is1px) {
        return resizeMode.mixedpx2;
    }
    if (is1perc) {
        return resizeMode.mixedperc1;
    }
    if (is2perc) {
        return resizeMode.mixedperc2;
    }
    return resizeMode.unknown;
}
function getBlockRange(block1, block2, isXLayout) {
    if (isXLayout === void 0) { isXLayout = true; }
    if (isXLayout) {
        return {
            min: block1.left + window.pageXOffset,
            max: block2.right + window.pageXOffset
        };
    }
    return {
        min: block1.top + window.pageYOffset,
        max: block2.bottom + window.pageYOffset
    };
}
var Cell = /** @class */ (function (_super) {
    __extends(Cell, _super);
    function Cell(parent, config) {
        var _this = _super.call(this, parent, config) || this;
        _this._parent = parent;
        _this._isTopParent = !(parent instanceof Cell);
        _this._initHandlers();
        _this.mount(parent, { redraw: function () {
                parent.paint();
            } });
        _this.id = _this.config.id;
        _this._css = "";
        return _this;
    }
    Cell.prototype.isVisible = function () {
        return !this.config.hidden;
    };
    Cell.prototype.isView = function () {
        return !!this._parent.config.views;
    };
    Cell.prototype.hide = function () {
        this.config.hidden = true;
        this.paint();
    };
    Cell.prototype.show = function (_forced) {
        if (this.isView()) {
            this._parent.updateActiveView(this.id);
            return;
        }
        if (this._parent && !this._parent.isVisible()) {
            this._parent.show();
        }
        this.config.hidden = false;
        this.paint();
    };
    Cell.prototype.getParent = function () {
        return this._parent;
    };
    Cell.prototype.getTopParent = function () {
        if (this._isTopParent) {
            return this;
        }
        var parent = this.getParent();
        while (parent) {
            if (parent._isTopParent) {
                return parent;
            }
            parent = parent.getParent();
        }
    };
    Cell.prototype.destructor = function () {
        this.config = null;
    };
    Cell.prototype.getWidget = function () {
        return this._ui;
    };
    Cell.prototype.attach = function (name, config) {
        if (typeof name === "object") {
            this._ui = name;
        }
        else if (typeof name === "string") {
            this._ui = new window.dhx[name](null, config);
        }
        else if (typeof name === "function") {
            if (name.prototype instanceof view_1.View) {
                this._ui = new name(null, config);
            }
            else {
                this._ui = {
                    getRootView: function () {
                        return name(config);
                    }
                };
            }
        }
        this.paint();
        return this._ui;
    };
    Cell.prototype.toVDOM = function (nodes, isTopParent) {
        if (isTopParent === void 0) { isTopParent = false; }
        var conf = this.config;
        if (conf.hidden) {
            return;
        }
        var css = this._css + " " + (this.config.css || "") + (isTopParent ? " dhx_widget" : "");
        var style = this._calculateStyle();
        var kids;
        if (this.config.html) {
            kids = [dom_1.el("div", { ".innerHTML": this.config.html })];
        }
        else if (this._ui) {
            var view = this._ui.getRootView();
            if (view.render) {
                view = dom_1.inject(view);
            }
            kids = [view];
        }
        else {
            kids = nodes || null;
        }
        var resizer = this.config.canResize && !this._isLastCell() ?
            dom_1.el(".resizer." + (this._isXDirection() ? "x" : "y"), __assign({}, this._resizerHandlers, { _ref: "resizer_" + this._uid }), [dom_1.el("div", {
                    class: "dxi " + (this._isXDirection() ? "dxi-dots-vertical" : "dxi-dots-horizontal")
                })]) : null;
        var handlers = {};
        if (this.config.on) {
            for (var key in this.config.on) {
                handlers["on" + key] = this.config.on[key];
            }
        }
        var cell = dom_1.el("div", __assign({ _key: this._uid, style: style, _ref: this._uid }, handlers, { class: "dhx_cell " + css + (this.config.collapsed ? " collapsed" : "") }), [
            this.config.header ? dom_1.el("div", {
                class: "dhx_cell_header",
                onclick: this._handlers.collapse
            }, [
                dom_1.el(".header-text", this.config.header),
                dom_1.el(".header-action-icon", [
                    dom_1.el("div", {
                        class: "dxi " + this.config.headerIcon
                    })
                ])
            ]) : null,
            !this.config.collapsed ? dom_1.el("div", {
                class: "dhx_cell_content"
            }, kids) : null,
            this.config.footer ? dom_1.el("div", {
                class: "dhx_cell_footer",
            }, this.config.footer) : null
        ]);
        return resizer ? [
            cell,
            resizer
        ] : cell;
    };
    Cell.prototype._initHandlers = function () {
        var _this = this;
        var blockOpts = {
            left: null,
            top: null,
            isActive: false,
            range: null,
            xLayout: null,
            nextCell: null,
            size: null,
            resizerLength: null,
            mode: null,
            percentsum: null
        };
        var mouseUp = function () {
            blockOpts.isActive = false;
            document.body.classList.remove("dhx-no-select");
            document.removeEventListener("mouseup", mouseUp);
            document.removeEventListener("mousemove", mouseMove);
        };
        var mouseMove = function (e) {
            if (!blockOpts.isActive || blockOpts.mode === resizeMode.unknown) {
                return;
            }
            var newValue = blockOpts.xLayout ? e.x - blockOpts.range.min - window.pageXOffset :
                e.y - blockOpts.range.min - window.pageYOffset;
            var prop = blockOpts.xLayout ? "width" : "height";
            if (newValue < 0) {
                newValue = blockOpts.resizerLength / 2;
            }
            else if (newValue > blockOpts.size) {
                newValue = blockOpts.size - blockOpts.resizerLength;
            }
            switch (blockOpts.mode) {
                case resizeMode.pixels:
                    _this.config[prop] = newValue - blockOpts.resizerLength / 2 + "px";
                    blockOpts.nextCell.config[prop] = blockOpts.size - newValue - blockOpts.resizerLength / 2 + "px";
                    break;
                case resizeMode.mixedpx1:
                    _this.config[prop] = newValue - blockOpts.resizerLength / 2 + "px";
                    break;
                case resizeMode.mixedpx2:
                    blockOpts.nextCell.config[prop] = blockOpts.size - newValue - blockOpts.resizerLength / 2 + "px";
                    break;
                case resizeMode.percents:
                    _this.config[prop] = newValue / blockOpts.size * blockOpts.percentsum + "%";
                    blockOpts.nextCell.config[prop] = (blockOpts.size - newValue) / blockOpts.size * blockOpts.percentsum + "%";
                    break;
                case resizeMode.mixedperc1:
                    _this.config[prop] = newValue / blockOpts.size * blockOpts.percentsum + "%";
                    break;
                case resizeMode.mixedperc2:
                    blockOpts.nextCell.config[prop] = (blockOpts.size - newValue) / blockOpts.size * blockOpts.percentsum + "%";
                    break;
            }
            _this.paint();
        };
        this._handlers = {
            collapse: function () {
                if (!_this.config.canCollapse) {
                    return;
                }
                _this.config.collapsed = !_this.config.collapsed;
                _this.paint();
            }
        };
        this._resizerHandlers = {
            onmousedown: function (e) {
                if (e.which === 3) {
                    return;
                }
                if (blockOpts.isActive) {
                    mouseUp();
                }
                document.body.classList.add("dhx-no-select");
                var block = _this._getCellView();
                var nextCell = _this._getNextCell();
                var nextBlock = nextCell._getCellView();
                var resizerBlock = _this._getResizerView();
                var blockOffsets = block.el.getBoundingClientRect();
                var resizerOffsets = resizerBlock.el.getBoundingClientRect();
                var nextBlockOffsets = nextBlock.el.getBoundingClientRect();
                blockOpts.xLayout = _this._isXDirection();
                blockOpts.left = blockOffsets.left + window.pageXOffset;
                blockOpts.top = blockOffsets.top + window.pageYOffset;
                blockOpts.range = getBlockRange(blockOffsets, nextBlockOffsets, blockOpts.xLayout);
                blockOpts.size = blockOpts.range.max - blockOpts.range.min;
                blockOpts.isActive = true;
                blockOpts.nextCell = nextCell;
                blockOpts.resizerLength = blockOpts.xLayout ? resizerOffsets.width : resizerOffsets.height;
                blockOpts.mode = getResizeMode(blockOpts.xLayout, _this.config, nextCell.config);
                if (blockOpts.mode === resizeMode.percents) {
                    var field = blockOpts.xLayout ? "width" : "height";
                    blockOpts.percentsum = parseFloat(_this.config[field]) + parseFloat(nextCell.config[field]);
                }
                if (blockOpts.mode === resizeMode.mixedperc1) {
                    var field = blockOpts.xLayout ? "width" : "height";
                    blockOpts.percentsum = 1 / (blockOffsets[field] / (blockOpts.size - blockOpts.resizerLength)) * parseFloat(_this.config[field]);
                }
                if (blockOpts.mode === resizeMode.mixedperc2) {
                    var field = blockOpts.xLayout ? "width" : "height";
                    blockOpts.percentsum = 1 / (nextBlockOffsets[field] / (blockOpts.size - blockOpts.resizerLength)) * parseFloat(nextCell.config[field]);
                }
                document.addEventListener("mouseup", mouseUp);
                document.addEventListener("mousemove", mouseMove);
            },
            ondragstart: function (e) { return e.preventDefault(); }
        };
    };
    Cell.prototype._isLastCell = function () {
        var parent = this._parent;
        return parent && parent._cells.indexOf(this) === parent._cells.length - 1;
    };
    Cell.prototype._getNextCell = function () {
        var parent = this._parent;
        var index = parent._cells.indexOf(this);
        return parent._cells[index + 1];
    };
    Cell.prototype._getCellView = function () {
        return this.getTopParent().getRootView().refs[this._uid];
    };
    Cell.prototype._getResizerView = function () {
        return this.getTopParent().getRootView().refs["resizer_" + this._uid];
    };
    Cell.prototype._isXDirection = function () {
        return this._parent && this._parent._xLayout;
    };
    Cell.prototype._calculateStyle = function () {
        var conf = this.config;
        var style = {};
        if (this._isXDirection()) {
            if (this.config.width !== undefined) {
                style.flex = "0 0 " + conf.width;
            }
            if (conf.height !== undefined) {
                style.height = conf.height;
            }
        }
        else {
            if (this.config.height !== undefined) {
                style.flex = "0 0 " + conf.height;
            }
            if (conf.width !== undefined) {
                style.width = conf.width;
            }
        }
        return style;
    };
    return Cell;
}(view_1.View));
exports.Cell = Cell;


/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(26));
__export(__webpack_require__(61));
__export(__webpack_require__(62));
__export(__webpack_require__(63));
__export(__webpack_require__(17));
var types_1 = __webpack_require__(4);
exports.ToolbarEvents = types_1.ToolbarEvents;
exports.ItemType = types_1.ItemType;


/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = __webpack_require__(0);
var helpers_1 = __webpack_require__(2);
function button(item) {
    return dom_1.el("div", {
        class: "button-container main-btn element" + helpers_1.getCss(item) + (item.value ? "" : " no-text"),
        dhx_id: item.id
    }, [
        helpers_1.counter(item),
        item.icon ? helpers_1.icon(item.icon) : null,
        item.value ? dom_1.el(".button-text", item.value) : null
    ]);
}
exports.button = button;


/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = __webpack_require__(0);
var helpers_1 = __webpack_require__(2);
function customHTMLButton(item) {
    return dom_1.el("div", {
        class: "button-container custom-html-btn element" + helpers_1.getCss(item),
        dhx_id: item.id
    }, [
        helpers_1.counter(item),
        dom_1.el(".html-content", {
            ".innerHTML": item.html
        }),
        item.value ? dom_1.el(".button-text", item.value) : null
    ]);
}
exports.customHTMLButton = customHTMLButton;


/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = __webpack_require__(0);
var helpers_1 = __webpack_require__(2);
function dhx_button(item) {
    return dom_1.el("button", {
        class: "dhx_btn" + helpers_1.getCss(item) + helpers_1.getButtonCss(item),
        dhx_id: item.id
    }, [
        item.icon ? helpers_1.icon(item.icon) : null,
        item.value ? dom_1.el(".item-value", item.value) : null
    ]);
}
exports.dhx_button = dhx_button;


/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = __webpack_require__(0);
var helpers_1 = __webpack_require__(2);
function iconButton(item) {
    return dom_1.el("div", {
        class: "icon-btn element" + helpers_1.getCss(item),
        dhx_id: item.id
    }, [
        helpers_1.counter(item),
        helpers_1.icon(item.icon),
        item.css && item.css.indexOf("ripple") !== -1 ? dom_1.el(".ripple-container-outside") : null
    ]);
}
exports.iconButton = iconButton;


/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = __webpack_require__(0);
var helpers_1 = __webpack_require__(2);
function imageButton(item) {
    return dom_1.el("div", {
        class: "button-container img-btn element" + helpers_1.getCss(item),
        dhx_id: item.id
    }, [
        helpers_1.counter(item),
        dom_1.el(".img-button-wrapper", [
            dom_1.el("img.img-button", {
                src: item.src
            })
        ])
    ]);
}
exports.imageButton = imageButton;


/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = __webpack_require__(0);
var helpers_1 = __webpack_require__(2);
function imageButtonText(item) {
    return dom_1.el("div", {
        class: "button-container img-text-btn element" + helpers_1.getCss(item),
        dhx_id: item.id
    }, [
        helpers_1.counter(item),
        dom_1.el("img.img-button", {
            src: item.src
        }),
        dom_1.el(".button-text", item.value)
    ]);
}
exports.imageButtonText = imageButtonText;


/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = __webpack_require__(0);
var types_1 = __webpack_require__(4);
var helpers_1 = __webpack_require__(2);
function input(item, events) {
    return dom_1.el("div", {
        dhx_id: item.id,
        class: "input-container element" + helpers_1.getCss(item)
    }, [
        dom_1.el(".input-wrapper", [
            dom_1.el("input.text-input", {
                placeholder: item.placeholder,
                value: item.value,
                style: {
                    width: item.width ? item.width : null
                },
                _hooks: {
                    didInsert: function (node) {
                        if (events) {
                            events.fire(types_1.ToolbarEvents.inputCreated, [item.id, node.el]);
                        }
                    }
                },
                _key: item.id
            }),
            dom_1.el(".input-animation")
        ]),
        item.icon ? helpers_1.icon(item.icon) : null
    ]);
}
exports.input = input;


/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = __webpack_require__(0);
var helpers_1 = __webpack_require__(2);
function menuItem(item) {
    return dom_1.el("div", {
        class: "menu-item element" + helpers_1.getCss(item),
        dhx_id: item.id
    }, [
        item.icon ? helpers_1.icon(item.icon) : null,
        item.value ? dom_1.el("span.menu-item-content", item.value) : null,
        item.$openIcon ? dom_1.el(".dhx-icon.sub-menu-opener", [
            dom_1.el(".dxi." + (item.$openIcon === "right" ? ".dxi-menu-right" : ".dxi-menu-down"))
        ]) : null,
        item.hotkey ? dom_1.el(".hotkey", item.hotkey) : null
    ]);
}
exports.menuItem = menuItem;


/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = __webpack_require__(0);
function separator(_item) {
    return dom_1.el(".separator");
}
exports.separator = separator;


/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = __webpack_require__(0);
function spacer(_item) {
    return dom_1.el(".spacer");
}
exports.spacer = spacer;


/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = __webpack_require__(0);
var helpers_1 = __webpack_require__(2);
function text(item) {
    return dom_1.el("div", {
        class: "text element" + helpers_1.getCss(item),
        dhx_id: item.id
    }, item.value);
}
exports.text = text;


/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function getHotKeyCode(code) {
    var matches = code.toLowerCase().match(/\w+/g);
    var comp = 0;
    var key = "";
    for (var i = 0; i < matches.length; i++) {
        var check = matches[i];
        if (check === "ctrl") {
            comp += 4;
        }
        else if (check === "shift") {
            comp += 2;
        }
        else if (check === "alt") {
            comp += 1;
        }
        else {
            key = check;
        }
    }
    return comp + key;
}
var KeyManager = /** @class */ (function () {
    function KeyManager() {
        var _this = this;
        this._keysStorage = {};
        document.addEventListener("keydown", function (e) {
            var comp = (e.ctrlKey ? 4 : 0) + (e.shiftKey ? 2 : 0) + (e.altKey ? 1 : 0);
            var code = comp + e.key.toLowerCase();
            var action = _this._keysStorage[code];
            if (action) {
                action.handler(e);
            }
        });
    }
    KeyManager.prototype.addHotKey = function (key, handler, scope) {
        var code = getHotKeyCode(key);
        this._keysStorage[code] = {
            handler: handler,
            scope: scope
        };
    };
    KeyManager.prototype.removeHotKey = function (key, scope) {
        var keyStorage = this._keysStorage;
        if (key) {
            var code = getHotKeyCode(key);
            delete keyStorage[code];
        }
        if (scope) {
            for (var code in keyStorage) {
                if (keyStorage[code].scope === scope) {
                    delete keyStorage[code];
                }
            }
        }
    };
    KeyManager.prototype.exist = function (key) {
        var code = getHotKeyCode(key);
        return !!this._keysStorage[code];
    };
    return KeyManager;
}());
exports.keyManager = new KeyManager();


/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var html_1 = __webpack_require__(1);
var helper_1 = __webpack_require__(13);
var MenuBase_1 = __webpack_require__(18);
var ContextMenu = /** @class */ (function (_super) {
    __extends(ContextMenu, _super);
    function ContextMenu() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._isContextMenu = true;
        return _this;
    }
    ContextMenu.prototype.showAt = function (elem, showAt) {
        if (showAt === void 0) { showAt = "bottom"; }
        if (elem instanceof MouseEvent) {
            this._changeActivePosition({
                left: window.pageXOffset + elem.x + 1,
                right: window.pageXOffset + elem.x + 1,
                top: window.pageYOffset + elem.y,
                bottom: window.pageYOffset + elem.y
            }, showAt);
        }
        else {
            var node = html_1.toNode(elem);
            this._changeActivePosition(helper_1.getRealPosition(node), showAt);
        }
    };
    ContextMenu.prototype._close = function () {
        this._activeMenu = null;
        this._changeActivePosition(null, null);
    };
    ContextMenu.prototype._normalizeData = function () {
        var _this = this;
        var root = this.data.getRoot();
        this.data.eachChild(root, function (item) {
            if (_this.data.haveChilds(item.id)) {
                item.$openIcon = "right";
            }
        }, true);
    };
    ContextMenu.prototype._getMode = function (_item, _root, active) {
        return active ? this._mode : "right";
    };
    ContextMenu.prototype._changeActivePosition = function (position, mode) {
        this._activePosition = position;
        this._mode = mode;
        this._listenOuterClick();
        this.paint();
    };
    return ContextMenu;
}(MenuBase_1.MenuBase));
exports.ContextMenu = ContextMenu;


/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = __webpack_require__(0);
var MenuBase_1 = __webpack_require__(18);
var Menu = /** @class */ (function (_super) {
    __extends(Menu, _super);
    function Menu(element, config) {
        var _this = _super.call(this, element, config) || this;
        var render = function () { return _this._draw(); };
        _this.mount(element, dom_1.create({ render: render }));
        return _this;
    }
    Menu.prototype._draw = function () {
        return dom_1.el("div", __assign({ dhx_widget_id: this._uid, class: "main-menu" }, this._handlers), this._drawMenuItems(this.data.getRoot()));
    };
    return Menu;
}(MenuBase_1.MenuBase));
exports.Menu = Menu;


/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = __webpack_require__(0);
var helper_1 = __webpack_require__(13);
var Toolbar_1 = __webpack_require__(26);
var types_1 = __webpack_require__(4);
var Ribbon = /** @class */ (function (_super) {
    __extends(Ribbon, _super);
    function Ribbon() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Ribbon.prototype._draw = function () {
        var _this = this;
        return dom_1.el(".ribbon.dhx_widget", {
            dhx_widget_id: this._uid,
            onclick: this._handlers.onclick
        }, this.data.map(function (block) { return _this._drawBlock(block.id); }, this.data.getRoot(), false));
    };
    Ribbon.prototype._setRoot = function (id) {
        var parentId = this.data.getParent(id);
        if (this.data.getItem(parentId).type === types_1.ItemType.block) {
            this._currentRoot = id;
        }
    };
    Ribbon.prototype._normalizeData = function () {
        var _this = this;
        var root = this.data.getRoot();
        var groups = {};
        this.data.eachChild(root, function (item) {
            if (item.type === types_1.ItemType.menuItem) {
                if (_this.data.haveChilds(item.id)) {
                    _this.data.eachChild(item.id, function (child) { return child.type = child.type || types_1.ItemType.menuItem; }, false);
                    var parentId = _this.data.getParent(item.id);
                    var parent_1 = _this.data.getItem(parentId);
                    item.$openIcon = parent_1.type === types_1.ItemType.block ? "bot" : "right";
                }
            }
            if (item.group) {
                helper_1.addInGroups(groups, item);
            }
        }, true);
        this._groups = groups;
    };
    Ribbon.prototype._drawBlock = function (id) {
        var _this = this;
        var block = this.data.getItem(id);
        if (!block) {
            return null;
        }
        var direction = block.direction === "row" ? " ribbon-row" : " ribbon-cols";
        var childs = this.data.map(function (child) {
            if (child.type === types_1.ItemType.block) {
                return _this._drawBlock(child.id);
            }
            return _this._factory(child);
        }, id, false);
        return dom_1.el("div", {
            class: "ribbon-item-block" + direction
        }, [
            dom_1.el(".block-content", childs),
            block.label ? dom_1.el(".block-label", [dom_1.el("span", block.label)]) : null
        ]);
    };
    return Ribbon;
}(Toolbar_1.Toolbar));
exports.Ribbon = Ribbon;


/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Promise) {
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = __webpack_require__(3);
var html_1 = __webpack_require__(1);
var ts_data_1 = __webpack_require__(8);
var types_1 = __webpack_require__(15);
var Uploader = /** @class */ (function () {
    function Uploader(config, data, events) {
        if (config === void 0) { config = {}; }
        this.config = core_1.extend({
            autosend: true,
            updateFromResponse: true,
            fieldName: "file"
        }, config);
        this.data = data || new ts_data_1.DataCollection();
        this.events = events || this.data.events;
        this.isActive = false;
        this._fileInput = document.createElement("input");
        this._fileInput.type = "file";
        this._fileInput.multiple = true;
        this._initEvents();
        this._dropAreas = new Map();
    }
    Uploader.prototype.selectFile = function () {
        this._fileInput.click();
    };
    Uploader.prototype.linkDropArea = function (element) {
        var _this = this;
        var node = html_1.toNode(element);
        var mouseover = function () { return node.style.cursor = "pointer"; };
        var dragover = function (e) { return e.preventDefault(); };
        var drop = function (e) {
            e.preventDefault();
            _this.parseFiles(e.dataTransfer);
        };
        node.addEventListener("mouseover", mouseover);
        node.addEventListener("dragover", dragover);
        node.addEventListener("drop", drop);
        this._dropAreas.set(node, {
            mouseover: mouseover,
            dragover: dragover,
            drop: drop
        });
    };
    Uploader.prototype.unlinkDropArea = function (element) {
        var _this = this;
        if (!element) {
            this._dropAreas.forEach(function (_, node) {
                _this._unlinkDropArea(node);
            });
            this._dropAreas.clear();
        }
        else {
            var node = html_1.toNode(element);
            this._unlinkDropArea(node);
            this._dropAreas.delete(node);
        }
    };
    Uploader.prototype.parseFiles = function (dataTransfer) {
        if (!dataTransfer.items || !dataTransfer.items[0] || !dataTransfer.items[0].webkitGetAsEntry) {
            var files = dataTransfer.files;
            for (var i = 0; i < files.length; i++) {
                this._addFile(files[i]);
            }
            if (this.config.autosend) {
                this.send();
            }
        }
        else {
            this._parseAsWebkitEntry(dataTransfer.items);
        }
    };
    Uploader.prototype.send = function (params) {
        var _this = this;
        if (this._uploadInfo && this.isActive) {
            // cancel two active sends
            return;
        }
        var all = this.data.findAll(function (item) { return item.status === types_1.FileStatus.queue || item.status === types_1.FileStatus.failed; });
        var files = all.filter(function (file) { return _this.events.fire(types_1.UploaderEvents.beforeUploadFile, [file]); });
        if (!files.length) {
            return;
        }
        this.isActive = true;
        this._uploadInfo = {
            files: files,
            count: files.length,
            size: files.reduce(function (s, f) { return s + f.file.size; }, 0)
        };
        this.events.fire(types_1.UploaderEvents.uploadBegin, [files]);
        this.events.fire(types_1.UploaderEvents.uploadProgress, [0, 0, this._uploadInfo.size]);
        if (this.config.singleRequest) {
            this._xhrSend(files, params);
        }
        else {
            for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                var fileWrapper = files_1[_i];
                this._xhrSend([fileWrapper], params);
            }
        }
    };
    Uploader.prototype.abort = function (id) {
        if (!id) {
            if (!this._uploadInfo || !this._uploadInfo.files) {
                return;
            }
            for (var _i = 0, _a = this._uploadInfo.files; _i < _a.length; _i++) {
                var fileWrapper = _a[_i];
                this.abort(fileWrapper.id);
            }
            return;
        }
        else {
            var item = this.data.getItem(id);
            if (!item || !item.request || item.request.readyState === 4) {
                return;
            }
            item.request.abort();
        }
    };
    Uploader.prototype._unlinkDropArea = function (node) {
        var handlers = this._dropAreas.get(node);
        if (!handlers) {
            return;
        }
        var mouseover = handlers.mouseover, dragover = handlers.dragover, drop = handlers.drop;
        node.removeEventListener("mouseover", mouseover);
        node.removeEventListener("dragover", dragover);
        node.removeEventListener("drop", drop);
    };
    Uploader.prototype._initEvents = function () {
        var _this = this;
        this._fileInput.addEventListener("change", function () {
            var files = _this._fileInput.files;
            for (var i = 0; i < files.length; i++) {
                _this._addFile(files[i]);
            }
            if (_this.config.autosend) {
                _this.send();
            }
            _this._fileInput.value = null; // clear file input after get info about files
        });
    };
    Uploader.prototype._xhrSend = function (fileWrappers, params) {
        var _this = this;
        var formData = this._createFormData(fileWrappers, params);
        var request = new XMLHttpRequest();
        for (var _i = 0, fileWrappers_1 = fileWrappers; _i < fileWrappers_1.length; _i++) {
            var fileWrapper = fileWrappers_1[_i];
            this.data.update(fileWrapper.id, {
                request: request,
                status: types_1.FileStatus.inprogress,
                progress: 0
            });
        }
        request.open("POST", this.config.target);
        request.upload.onprogress = function (ev) {
            for (var _i = 0, fileWrappers_2 = fileWrappers; _i < fileWrappers_2.length; _i++) {
                var fileWrapper = fileWrappers_2[_i];
                _this.data.update(fileWrapper.id, {
                    progress: ev.loaded / ev.total,
                    status: types_1.FileStatus.inprogress
                });
            }
            var current = _this._uploadInfo.files.reduce(function (tot, file) { return tot + file.size * file.progress; }, 0) || 0;
            var total = _this._uploadInfo.size;
            var progress = current / _this._uploadInfo.size * 100 || 0;
            _this.events.fire(types_1.UploaderEvents.uploadProgress, [progress, current, total]);
        };
        request.onloadend = function () {
            _this._uploadInfo.count = _this.config.singleRequest ? 0 : _this._uploadInfo.count - 1;
            var status = request.status === 200 ? types_1.FileStatus.uploaded : types_1.FileStatus.failed;
            var extra = request.status === 200 && request.response ? JSON.parse(request.response) : null;
            for (var _i = 0, fileWrappers_3 = fileWrappers; _i < fileWrappers_3.length; _i++) {
                var fileWrapper = fileWrappers_3[_i];
                _this.data.update(fileWrapper.id, { status: status });
                if (status === types_1.FileStatus.uploaded) {
                    if (_this.config.updateFromResponse && extra) {
                        if (_this.config.singleRequest && extra[fileWrapper.id]) {
                            _this.data.update(fileWrapper.id, extra[fileWrapper.id]);
                        }
                        else if (!_this.config.singleRequest) {
                            _this.data.update(fileWrapper.id, extra);
                        }
                    }
                    _this.events.fire(types_1.UploaderEvents.uploadFile, [fileWrapper, extra]);
                }
                else {
                    _this.events.fire(types_1.UploaderEvents.uploadFail, [fileWrapper]);
                }
            }
            if (_this._uploadInfo.count === 0) {
                _this.isActive = false;
                _this.events.fire(types_1.UploaderEvents.uploadComplete, [_this._uploadInfo.files]);
            }
        };
        request.send(formData);
    };
    Uploader.prototype._parseAsWebkitEntry = function (items) {
        var _this = this;
        var reads = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i].webkitGetAsEntry();
            reads.push(this._traverseFileTree(item));
        }
        Promise.all(reads).then(function () {
            if (_this.config.autosend) {
                _this.send();
            }
        });
    };
    Uploader.prototype._createFormData = function (fileWrappers, params) {
        var fieldName = this.config.fieldName;
        var formData = new FormData();
        var extraParams = this.config.params;
        if (params) {
            for (var key in params) {
                formData.append(key, params[key]);
            }
        }
        if (extraParams) {
            for (var key in extraParams) {
                formData.append(key, extraParams[key]);
            }
        }
        var brackets = fileWrappers.length > 1 ? "[]" : "";
        for (var _i = 0, fileWrappers_4 = fileWrappers; _i < fileWrappers_4.length; _i++) {
            var fileWrapper = fileWrappers_4[_i];
            formData.append(fieldName + brackets, fileWrapper.file, fileWrapper.file.name);
            formData.append(fieldName + "_fullname" + brackets, fileWrapper.path + fileWrapper.file.name);
            formData.append(fieldName + "_id" + brackets, fileWrapper.id);
        }
        return formData;
    };
    Uploader.prototype._addFile = function (file, path) {
        if (path === void 0) { path = ""; }
        var fileWrapper = {
            id: core_1.uid(),
            file: file,
            progress: 0,
            status: types_1.FileStatus.queue,
            src: null,
            path: path
        };
        this.data.add(fileWrapper);
    };
    Uploader.prototype._traverseFileTree = function (item) {
        var _this = this;
        return new Promise(function (res) {
            var count = 0;
            var readEntry = function (entry, path) {
                if (entry.isFile) {
                    count++;
                    entry.file(function (file) {
                        count--;
                        _this._addFile(file, path);
                        if (count === 0) {
                            res();
                        }
                    });
                }
                else if (entry.isDirectory) {
                    var reader = entry.createReader();
                    readDirectory(reader, path + entry.name + "/");
                }
            };
            var readDirectory = function (reader, path) {
                count++;
                reader.readEntries(function (entries) {
                    count--;
                    for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                        var entry = entries_1[_i];
                        readEntry(entry, path);
                    }
                    if (count === 0) {
                        res();
                    }
                });
            };
            readEntry(item, "");
        });
    };
    return Uploader;
}());
exports.Uploader = Uploader;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(10)))

/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.layoutConfig = {
    css: "vault-layout",
    rows: [
        {
            id: "topbar",
            css: "vault-topbar"
        },
        {
            id: "vault",
            css: "vault-file-grid"
        }
    ]
};
exports.layoutConfigWithoutTopbar = {
    css: "vault-layout",
    rows: [
        {
            id: "vault",
            css: "vault-file-grid"
        }
    ]
};


/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var en_1 = __webpack_require__(14);
var basis = [
    "byte",
    "kilobyte",
    "megabyte",
    "gigabyte"
];
function getBasis(size, current) {
    if (size === void 0) { size = 0; }
    if (current === void 0) { current = 0; }
    return size < 1024 ? size + " " + en_1.default[basis[current]] : this.getBasis(Math.round(size / 1024), current + 1);
}
exports.getBasis = getBasis;
var MAX_WORD_LENGTH = 13;
function truncateWord(word, len) {
    if (len === void 0) { len = MAX_WORD_LENGTH; }
    var start;
    var end;
    if (word.length <= len) {
        return word;
    }
    var dotIndex = word.lastIndexOf(".");
    if (dotIndex === -1) {
        end = word.substr(word.length - 4);
        start = word.substr(0, len - 7);
    }
    else {
        var endStartFrom = dotIndex - 3;
        end = word.substr(endStartFrom);
        start = word.substr(0, len - (word.length - endStartFrom));
    }
    return start + "..." + end;
}
exports.truncateWord = truncateWord;
function calculateCover(image) {
    var width = image.width, height = image.height;
    var imageAspectRatio = width / height;
    var sHeight;
    var sWidth;
    var sx;
    var sy;
    if (imageAspectRatio > 1) {
        // width > height
        sWidth = height;
        sHeight = height;
        sx = (width - sWidth) / 2;
        sy = 0;
    }
    else if (imageAspectRatio < 1) {
        // width < height
        sWidth = width;
        sHeight = width;
        sx = 0;
        sy = (height - sHeight) / 2;
    }
    else {
        // width == height
        sHeight = width;
        sWidth = width;
        sx = 0;
        sy = 0;
    }
    return {
        sx: sx,
        sy: sy,
        sWidth: sWidth,
        sHeight: sHeight,
        dx: 0,
        dy: 0
    };
}
exports.calculateCover = calculateCover;
var FileType;
(function (FileType) {
    FileType["image"] = "image";
    FileType["video"] = "video";
    FileType["archive"] = "archive";
    FileType["table"] = "table";
    FileType["document"] = "document";
    FileType["presentation"] = "presentation";
    FileType["application"] = "application";
    FileType["web"] = "web";
    FileType["apple"] = "apple";
    FileType["pdf"] = "pdf";
    FileType["psd"] = "psd";
    FileType["audio"] = "audio";
    FileType["other"] = "other";
    FileType["text"] = "text";
})(FileType = exports.FileType || (exports.FileType = {}));
function getMimeAndExtension(fileWrapper) {
    var extension = fileWrapper.name.split(".").pop() || "none";
    var mime = fileWrapper.file ? fileWrapper.file.type : "";
    return {
        extension: extension,
        mime: mime
    };
}
function getFileType(extension, mime) {
    switch (extension) {
        case "jpg":
        case "jpeg":
        case "gif":
        case "png":
        case "bmp":
        case "tiff":
        case "pcx":
        case "svg":
        case "ico":
            return FileType.image;
        case "avi":
        case "mpg":
        case "mpeg":
        case "rm":
        case "move":
        case "mov":
        case "mkv":
        case "flv":
        case "f4v":
        case "mp4":
        case "3gp":
        case "wmv":
        case "webm":
        case "vob":
            return FileType.video;
        case "rar":
        case "zip":
        case "tar":
        case "tgz":
        case "arj":
        case "gzip":
        case "bzip2":
        case "7z":
        case "ace":
        case "apk":
        case "deb":
        case "zipx":
        case "cab":
        case "tar-gz":
        case "rpm":
        case "xar":
            return FileType.archive;
        case "xlr":
        case "xls":
        case "xlsm":
        case "xlsx":
        case "ods":
        case "csv":
        case "tsv":
            return FileType.table;
        case "doc":
        case "docx":
        case "docm":
        case "dot":
        case "dotx":
        case "odt":
        case "wpd":
        case "wps":
        case "pages":
            return FileType.document;
        case "wav":
        case "aiff":
        case "au":
        case "mp3":
        case "aac":
        case "wma":
        case "ogg":
        case "flac":
        case "ape":
        case "wv":
        case "m4a":
        case "mid":
        case "midi":
            return FileType.audio;
        case "pot":
        case "potm":
        case "potx":
        case "pps":
        case "ppsm":
        case "ppsx":
        case "ppt":
        case "pptx":
        case "pptm":
        case "odp":
            return FileType.presentation;
        case "html":
        case "htm":
        case "eml":
            return FileType.web;
        case "exe":
            return FileType.application;
        case "dmg":
            return FileType.apple;
        case "pdf":
        case "ps":
        case "eps":
            return FileType.pdf;
        case "psd":
            return FileType.psd;
        case "txt":
        case "djvu":
        case "nfo":
        case "xml":
            return FileType.text;
        default:
            var type = mime.split("/")[0];
            switch (type) {
                case "image":
                    return FileType.image;
                case "audio":
                    return FileType.audio;
                case "video":
                    return FileType.video;
                default:
                    return FileType.other;
            }
    }
}
exports.getFileType = getFileType;
function getFileClassName(fileWrapper) {
    var _a = getMimeAndExtension(fileWrapper), mime = _a.mime, extension = _a.extension;
    return getFileType(extension, mime) + " extension-" + extension;
}
exports.getFileClassName = getFileClassName;
function isImage(fileWrapper) {
    var _a = getMimeAndExtension(fileWrapper), mime = _a.mime, extension = _a.extension;
    var fileType = getFileType(extension, mime);
    return fileType === FileType.image;
}
exports.isImage = isImage;


/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = __webpack_require__(0);
var view_1 = __webpack_require__(12);
var en_1 = __webpack_require__(14);
var types_1 = __webpack_require__(15);
var ProgressBar = /** @class */ (function (_super) {
    __extends(ProgressBar, _super);
    function ProgressBar(events, config) {
        var _this = _super.call(this, null, config) || this;
        _this.events = events;
        _this._progress = 0;
        var render = function () { return _this._draw(); };
        _this.mount(null, dom_1.create({
            render: render
        }));
        _this._abortUpload = function () {
            _this.events.fire(types_1.ProgressBarEvents.cancel);
        };
        return _this;
    }
    ProgressBar.prototype.setState = function (progress, extra) {
        this._progress = progress;
        if (this.config.template) {
            this._progressText = this.config.template(progress, extra);
        }
        else {
            this._progressText = this._progress.toFixed(1) + "%";
        }
        this.paint();
    };
    ProgressBar.prototype._draw = function () {
        return dom_1.el(".progress-bar", {
            _key: this._uid
        }, [
            dom_1.el(".progress-indicator", {
                style: {
                    width: this._progress + "%"
                }
            }),
            dom_1.el(".progress-text", {
                ".innerHTML": this._progressText
            }),
            dom_1.el("button", {
                class: "dhx_btn dhx_btn--flat dhx_btn_small action-abort-all",
                onclick: this._abortUpload
            }, en_1.default.cancel)
        ]);
    };
    return ProgressBar;
}(view_1.View));
exports.ProgressBar = ProgressBar;


/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var ReadStackPreview = /** @class */ (function () {
    function ReadStackPreview(data) {
        this._readerStack = [];
        this._isActive = false;
        this._data = data;
    }
    ReadStackPreview.prototype.add = function (fileWrapper, wait) {
        if (wait === void 0) { wait = false; }
        this._readerStack.push(fileWrapper);
        if (!wait) {
            this.read();
        }
    };
    ReadStackPreview.prototype.read = function () {
        var _this = this;
        if (!this._readerStack.length || this._isActive) {
            return;
        }
        var fileWrapper = this._readerStack.shift();
        this._isActive = true;
        var reader = new FileReader();
        reader.readAsDataURL(fileWrapper.file);
        reader.onload = function (e) {
            var image = new Image();
            image.src = e.target.result;
            image.onload = function () {
                if (_this._data.exists(fileWrapper.id)) {
                    _this._data.update(fileWrapper.id, { image: image });
                }
                _this._isActive = false;
                _this.read();
            };
        };
        reader.onerror = function () {
            _this._isActive = false;
            _this.read();
        };
    };
    ReadStackPreview.prototype.stop = function () {
        this._readerStack = [];
    };
    return ReadStackPreview;
}());
exports.ReadStackPreview = ReadStackPreview;


/***/ })
/******/ ]);
});if (window.dhx_legacy) { if (window.dhx){ for (var key in dhx) dhx_legacy[key] = dhx[key]; } window.dhx = dhx_legacy; delete window.dhx_legacy; }
"use strict";
exports.__esModule = true;
var JSMpegWritableSource = /** @class */ (function () {
    function JSMpegWritableSource(url, options) {
        this.destination = null;
        this.completed = false;
        this.established = false;
        this.progress = 0;
        // Streaming is obiously true when using a stream
        this.streaming = true;
    }
    JSMpegWritableSource.prototype.connect = function (destination) {
        this.destination = destination;
    };
    JSMpegWritableSource.prototype.start = function () {
        this.established = true;
        this.completed = true;
        this.progress = 1;
    };
    JSMpegWritableSource.prototype.resume = function () {
    };
    JSMpegWritableSource.prototype.destroy = function () {
    };
    JSMpegWritableSource.prototype.write = function (data) {
        this.destination.write(data);
    };
    return JSMpegWritableSource;
}());
exports["default"] = JSMpegWritableSource;

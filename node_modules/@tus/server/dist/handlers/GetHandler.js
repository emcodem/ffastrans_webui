"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetHandler = void 0;
const node_stream_1 = __importDefault(require("node:stream"));
const BaseHandler_1 = require("./BaseHandler");
const utils_1 = require("@tus/utils");
class GetHandler extends BaseHandler_1.BaseHandler {
    constructor() {
        super(...arguments);
        this.paths = new Map();
        /**
         * reMimeType is a RegExp for check mime-type form compliance with RFC1341
         * for support mime-type and extra parameters, for example:
         *
         * ```
         * text/plain; charset=utf-8
         * ```
         *
         * See: https://datatracker.ietf.org/doc/html/rfc1341 (Page 6)
         */
        this.reMimeType = 
        // biome-ignore lint/suspicious/noControlCharactersInRegex: it's fine
        /^(?:application|audio|example|font|haptics|image|message|model|multipart|text|video|x-(?:[0-9A-Za-z!#$%&'*+.^_`|~-]+))\/([0-9A-Za-z!#$%&'*+.^_`|~-]+)((?:[ 	]*;[ 	]*[0-9A-Za-z!#$%&'*+.^_`|~-]+=(?:[0-9A-Za-z!#$%&'*+.^_`|~-]+|"(?:[^"\\]|\.)*"))*)$/;
        /**
         * mimeInlineBrowserWhitelist is a set containing MIME types which should be
         * allowed to be rendered by browser inline, instead of being forced to be
         * downloaded. For example, HTML or SVG files are not allowed, since they may
         * contain malicious JavaScript. In a similar fashion PDF is not on this list
         * as their parsers commonly contain vulnerabilities which can be exploited.
         */
        this.mimeInlineBrowserWhitelist = new Set([
            'text/plain',
            'image/png',
            'image/jpeg',
            'image/gif',
            'image/bmp',
            'image/webp',
            'audio/wave',
            'audio/wav',
            'audio/x-wav',
            'audio/x-pn-wav',
            'audio/webm',
            'audio/ogg',
            'video/mp4',
            'video/webm',
            'video/ogg',
            'application/ogg',
        ]);
    }
    registerPath(path, handler) {
        this.paths.set(path, handler);
    }
    /**
     * Read data from the DataStore and send the stream.
     */
    async send(req, res
    // biome-ignore lint/suspicious/noConfusingVoidType: it's fine
    ) {
        if (this.paths.has(req.url)) {
            const handler = this.paths.get(req.url);
            return handler(req, res);
        }
        if (!('read' in this.store)) {
            throw utils_1.ERRORS.FILE_NOT_FOUND;
        }
        const id = this.getFileIdFromRequest(req);
        if (!id) {
            throw utils_1.ERRORS.FILE_NOT_FOUND;
        }
        if (this.options.onIncomingRequest) {
            await this.options.onIncomingRequest(req, res, id);
        }
        const stats = await this.store.getUpload(id);
        if (!stats || stats.offset !== stats.size) {
            throw utils_1.ERRORS.FILE_NOT_FOUND;
        }
        const { contentType, contentDisposition } = this.filterContentType(stats);
        // @ts-expect-error exists if supported
        const file_stream = await this.store.read(id);
        const headers = {
            'Content-Length': stats.offset,
            'Content-Type': contentType,
            'Content-Disposition': contentDisposition,
        };
        res.writeHead(200, headers);
        return node_stream_1.default.pipeline(file_stream, res, () => {
            // We have no need to handle streaming errors
        });
    }
    /**
     * filterContentType returns the values for the Content-Type and
     * Content-Disposition headers for a given upload. These values should be used
     * in responses for GET requests to ensure that only non-malicious file types
     * are shown directly in the browser. It will extract the file name and type
     * from the "filename" and "filetype".
     * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
     */
    filterContentType(stats) {
        let contentType;
        let contentDisposition;
        const { filetype, filename } = stats.metadata ?? {};
        if (filetype && this.reMimeType.test(filetype)) {
            // If the filetype from metadata is well formed, we forward use this
            // for the Content-Type header. However, only whitelisted mime types
            // will be allowed to be shown inline in the browser
            contentType = filetype;
            if (this.mimeInlineBrowserWhitelist.has(filetype)) {
                contentDisposition = 'inline';
            }
            else {
                contentDisposition = 'attachment';
            }
        }
        else {
            // If the filetype from the metadata is not well formed, we use a
            // default type and force the browser to download the content
            contentType = 'application/octet-stream';
            contentDisposition = 'attachment';
        }
        // Add a filename to Content-Disposition if one is available in the metadata
        if (filename) {
            contentDisposition += `; filename=${this.quote(filename)}`;
        }
        return {
            contentType,
            contentDisposition,
        };
    }
    /**
     * Convert string to quoted string literals
     */
    quote(value) {
        return `"${value.replace(/"/g, '\\"')}"`;
    }
}
exports.GetHandler = GetHandler;
//# sourceMappingURL=GetHandler.js.map
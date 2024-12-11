"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatchHandler = void 0;
const debug_1 = __importDefault(require("debug"));
const BaseHandler_1 = require("./BaseHandler");
const utils_1 = require("@tus/utils");
const log = (0, debug_1.default)('tus-node-server:handlers:patch');
class PatchHandler extends BaseHandler_1.BaseHandler {
    /**
     * Write data to the DataStore and return the new offset.
     */
    async send(req, res, context) {
        try {
            const id = this.getFileIdFromRequest(req);
            if (!id) {
                throw utils_1.ERRORS.FILE_NOT_FOUND;
            }
            // The request MUST include a Upload-Offset header
            if (req.headers['upload-offset'] === undefined) {
                throw utils_1.ERRORS.MISSING_OFFSET;
            }
            const offset = Number.parseInt(req.headers['upload-offset'], 10);
            // The request MUST include a Content-Type header
            const content_type = req.headers['content-type'];
            if (content_type === undefined) {
                throw utils_1.ERRORS.INVALID_CONTENT_TYPE;
            }
            if (this.options.onIncomingRequest) {
                await this.options.onIncomingRequest(req, res, id);
            }
            const maxFileSize = await this.getConfiguredMaxSize(req, id);
            const lock = await this.acquireLock(req, id, context);
            let upload;
            let newOffset;
            try {
                upload = await this.store.getUpload(id);
                // If a Client does attempt to resume an upload which has since
                // been removed by the Server, the Server SHOULD respond with the
                // with the 404 Not Found or 410 Gone status. The latter one SHOULD
                // be used if the Server is keeping track of expired uploads.
                const now = Date.now();
                const creation = upload.creation_date
                    ? new Date(upload.creation_date).getTime()
                    : now;
                const expiration = creation + this.store.getExpiration();
                if (this.store.hasExtension('expiration') &&
                    this.store.getExpiration() > 0 &&
                    now > expiration) {
                    throw utils_1.ERRORS.FILE_NO_LONGER_EXISTS;
                }
                if (upload.offset !== offset) {
                    // If the offsets do not match, the Server MUST respond with the 409 Conflict status without modifying the upload resource.
                    log(`[PatchHandler] send: Incorrect offset - ${offset} sent but file is ${upload.offset}`);
                    throw utils_1.ERRORS.INVALID_OFFSET;
                }
                // The request MUST validate upload-length related headers
                const upload_length = req.headers['upload-length'];
                if (upload_length !== undefined) {
                    const size = Number.parseInt(upload_length, 10);
                    // Throw error if extension is not supported
                    if (!this.store.hasExtension('creation-defer-length')) {
                        throw utils_1.ERRORS.UNSUPPORTED_CREATION_DEFER_LENGTH_EXTENSION;
                    }
                    // Throw error if upload-length is already set.
                    if (upload.size !== undefined) {
                        throw utils_1.ERRORS.INVALID_LENGTH;
                    }
                    if (size < upload.offset) {
                        throw utils_1.ERRORS.INVALID_LENGTH;
                    }
                    if (maxFileSize > 0 && size > maxFileSize) {
                        throw utils_1.ERRORS.ERR_MAX_SIZE_EXCEEDED;
                    }
                    await this.store.declareUploadLength(id, size);
                    upload.size = size;
                }
                const maxBodySize = await this.calculateMaxBodySize(req, upload, maxFileSize);
                newOffset = await this.writeToStore(req, upload, maxBodySize, context);
            }
            finally {
                await lock.unlock();
            }
            upload.offset = newOffset;
            this.emit(utils_1.EVENTS.POST_RECEIVE, req, res, upload);
            //Recommended response defaults
            const responseData = {
                status: 204,
                headers: {
                    'Upload-Offset': newOffset,
                },
                body: '',
            };
            if (newOffset === upload.size && this.options.onUploadFinish) {
                try {
                    const resOrObject = await this.options.onUploadFinish(req, res, upload);
                    // Backwards compatibility, remove in next major
                    // Ugly check because we can't use `instanceof` because we mock the instance in tests
                    if (typeof resOrObject.write === 'function' &&
                        typeof resOrObject.writeHead === 'function') {
                        res = resOrObject;
                    }
                    else {
                        const obj = resOrObject;
                        res = obj.res;
                        if (obj.status_code)
                            responseData.status = obj.status_code;
                        if (obj.body)
                            responseData.body = obj.body;
                        if (obj.headers)
                            responseData.headers = Object.assign(obj.headers, responseData.headers);
                    }
                }
                catch (error) {
                    log(`onUploadFinish: ${error.body}`);
                    throw error;
                }
            }
            if (this.store.hasExtension('expiration') &&
                this.store.getExpiration() > 0 &&
                upload.creation_date &&
                (upload.size === undefined || newOffset < upload.size)) {
                const creation = new Date(upload.creation_date);
                // Value MUST be in RFC 7231 datetime format
                const dateString = new Date(creation.getTime() + this.store.getExpiration()).toUTCString();
                responseData.headers['Upload-Expires'] = dateString;
            }
            // The Server MUST acknowledge successful PATCH requests with the 204
            const writtenRes = this.write(res, responseData.status, responseData.headers, responseData.body);
            if (newOffset === upload.size) {
                this.emit(utils_1.EVENTS.POST_FINISH, req, writtenRes, upload);
            }
            return writtenRes;
        }
        catch (e) {
            context.abort();
            throw e;
        }
    }
}
exports.PatchHandler = PatchHandler;
//# sourceMappingURL=PatchHandler.js.map
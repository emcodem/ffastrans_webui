"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostHandler = void 0;
const debug_1 = __importDefault(require("debug"));
const BaseHandler_1 = require("./BaseHandler");
const utils_1 = require("@tus/utils");
const HeaderValidator_1 = require("../validators/HeaderValidator");
const log = (0, debug_1.default)('tus-node-server:handlers:post');
class PostHandler extends BaseHandler_1.BaseHandler {
    constructor(store, options) {
        if (options.namingFunction && typeof options.namingFunction !== 'function') {
            throw new Error("'namingFunction' must be a function");
        }
        if (!options.namingFunction) {
            options.namingFunction = utils_1.Uid.rand;
        }
        super(store, options);
    }
    /**
     * Create a file in the DataStore.
     */
    async send(req, res, context) {
        if ('upload-concat' in req.headers && !this.store.hasExtension('concatentation')) {
            throw utils_1.ERRORS.UNSUPPORTED_CONCATENATION_EXTENSION;
        }
        const upload_length = req.headers['upload-length'];
        const upload_defer_length = req.headers['upload-defer-length'];
        const upload_metadata = req.headers['upload-metadata'];
        if (upload_defer_length !== undefined && // Throw error if extension is not supported
            !this.store.hasExtension('creation-defer-length')) {
            throw utils_1.ERRORS.UNSUPPORTED_CREATION_DEFER_LENGTH_EXTENSION;
        }
        if ((upload_length === undefined) === (upload_defer_length === undefined)) {
            throw utils_1.ERRORS.INVALID_LENGTH;
        }
        let metadata;
        if ('upload-metadata' in req.headers) {
            try {
                metadata = utils_1.Metadata.parse(upload_metadata);
            }
            catch {
                throw utils_1.ERRORS.INVALID_METADATA;
            }
        }
        let id;
        try {
            id = await this.options.namingFunction(req, metadata);
        }
        catch (error) {
            log('create: check your `namingFunction`. Error', error);
            throw error;
        }
        const maxFileSize = await this.getConfiguredMaxSize(req, id);
        if (upload_length &&
            maxFileSize > 0 &&
            Number.parseInt(upload_length, 10) > maxFileSize) {
            throw utils_1.ERRORS.ERR_MAX_SIZE_EXCEEDED;
        }
        if (this.options.onIncomingRequest) {
            await this.options.onIncomingRequest(req, res, id);
        }
        const upload = new utils_1.Upload({
            id,
            size: upload_length ? Number.parseInt(upload_length, 10) : undefined,
            offset: 0,
            metadata,
        });
        if (this.options.onUploadCreate) {
            try {
                const resOrObject = await this.options.onUploadCreate(req, res, upload);
                // Backwards compatibility, remove in next major
                // Ugly check because we can't use `instanceof` because we mock the instance in tests
                if (typeof resOrObject.write === 'function' &&
                    typeof resOrObject.writeHead === 'function') {
                    res = resOrObject;
                }
                else {
                    const obj = resOrObject;
                    res = obj.res;
                    if (obj.metadata) {
                        upload.metadata = obj.metadata;
                    }
                }
            }
            catch (error) {
                log(`onUploadCreate error: ${error.body}`);
                throw error;
            }
        }
        const lock = await this.acquireLock(req, id, context);
        let isFinal;
        let url;
        //Recommended response defaults
        const responseData = {
            status: 201,
            headers: {},
            body: '',
        };
        try {
            await this.store.create(upload);
            url = this.generateUrl(req, upload.id);
            this.emit(utils_1.EVENTS.POST_CREATE, req, res, upload, url);
            isFinal = upload.size === 0 && !upload.sizeIsDeferred;
            // The request MIGHT include a Content-Type header when using creation-with-upload extension
            if ((0, HeaderValidator_1.validateHeader)('content-type', req.headers['content-type'])) {
                const bodyMaxSize = await this.calculateMaxBodySize(req, upload, maxFileSize);
                const newOffset = await this.writeToStore(req, upload, bodyMaxSize, context);
                responseData.headers['Upload-Offset'] = newOffset.toString();
                isFinal = newOffset === Number.parseInt(upload_length, 10);
                upload.offset = newOffset;
            }
        }
        catch (e) {
            context.abort();
            throw e;
        }
        finally {
            await lock.unlock();
        }
        if (isFinal && this.options.onUploadFinish) {
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
        // The Upload-Expires response header indicates the time after which the unfinished upload expires.
        // If expiration is known at creation time, Upload-Expires header MUST be included in the response
        if (this.store.hasExtension('expiration') &&
            this.store.getExpiration() > 0 &&
            upload.creation_date) {
            const created = await this.store.getUpload(upload.id);
            if (created.offset !== Number.parseInt(upload_length, 10)) {
                const creation = new Date(upload.creation_date);
                // Value MUST be in RFC 7231 datetime format
                responseData.headers['Upload-Expires'] = new Date(creation.getTime() + this.store.getExpiration()).toUTCString();
            }
        }
        //Only append Location header if its valid for the final http status (201 or 3xx)
        if (responseData.status === 201 ||
            (responseData.status >= 300 && responseData.status < 400)) {
            responseData.headers.Location = url;
        }
        const writtenRes = this.write(res, responseData.status, responseData.headers, responseData.body);
        if (isFinal) {
            this.emit(utils_1.EVENTS.POST_FINISH, req, writtenRes, upload);
        }
        return writtenRes;
    }
}
exports.PostHandler = PostHandler;
//# sourceMappingURL=PostHandler.js.map
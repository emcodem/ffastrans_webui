"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteHandler = void 0;
const BaseHandler_1 = require("./BaseHandler");
const utils_1 = require("@tus/utils");
class DeleteHandler extends BaseHandler_1.BaseHandler {
    async send(req, res, context) {
        const id = this.getFileIdFromRequest(req);
        if (!id) {
            throw utils_1.ERRORS.FILE_NOT_FOUND;
        }
        if (this.options.onIncomingRequest) {
            await this.options.onIncomingRequest(req, res, id);
        }
        const lock = await this.acquireLock(req, id, context);
        try {
            if (this.options.disableTerminationForFinishedUploads) {
                const upload = await this.store.getUpload(id);
                if (upload.offset === upload.size) {
                    throw utils_1.ERRORS.INVALID_TERMINATION;
                }
            }
            await this.store.remove(id);
        }
        finally {
            await lock.unlock();
        }
        const writtenRes = this.write(res, 204, {});
        this.emit(utils_1.EVENTS.POST_TERMINATE, req, writtenRes, id);
        return writtenRes;
    }
}
exports.DeleteHandler = DeleteHandler;
//# sourceMappingURL=DeleteHandler.js.map
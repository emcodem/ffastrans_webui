"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Upload = void 0;
class Upload {
    constructor(upload) {
        if (!upload.id) {
            throw new Error('[File] constructor must be given an ID');
        }
        this.id = upload.id;
        this.size = upload.size;
        this.offset = upload.offset;
        this.metadata = upload.metadata;
        this.storage = upload.storage;
        this.creation_date = upload.creation_date ?? new Date().toISOString();
    }
    get sizeIsDeferred() {
        return this.size === undefined;
    }
}
exports.Upload = Upload;
//# sourceMappingURL=Upload.js.map
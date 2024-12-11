"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionsHandler = void 0;
const BaseHandler_1 = require("./BaseHandler");
const utils_1 = require("@tus/utils");
// A successful response indicated by the 204 No Content status MUST contain
// the Tus-Version header. It MAY include the Tus-Extension and Tus-Max-Size headers.
class OptionsHandler extends BaseHandler_1.BaseHandler {
    async send(req, res) {
        const maxSize = await this.getConfiguredMaxSize(req, null);
        res.setHeader('Tus-Version', '1.0.0');
        if (this.store.extensions.length > 0) {
            res.setHeader('Tus-Extension', this.store.extensions.join(','));
        }
        if (maxSize) {
            res.setHeader('Tus-Max-Size', maxSize);
        }
        const allowedHeaders = [...utils_1.HEADERS, ...(this.options.allowedHeaders ?? [])];
        res.setHeader('Access-Control-Allow-Methods', utils_1.ALLOWED_METHODS);
        res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
        res.setHeader('Access-Control-Max-Age', utils_1.MAX_AGE);
        return this.write(res, 204);
    }
}
exports.OptionsHandler = OptionsHandler;
//# sourceMappingURL=OptionsHandler.js.map
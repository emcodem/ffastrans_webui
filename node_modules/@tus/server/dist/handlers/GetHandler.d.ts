import stream from 'node:stream';
import { BaseHandler } from './BaseHandler';
import { type Upload } from '@tus/utils';
import type http from 'node:http';
import type { RouteHandler } from '../types';
export declare class GetHandler extends BaseHandler {
    paths: Map<string, RouteHandler>;
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
    reMimeType: RegExp;
    /**
     * mimeInlineBrowserWhitelist is a set containing MIME types which should be
     * allowed to be rendered by browser inline, instead of being forced to be
     * downloaded. For example, HTML or SVG files are not allowed, since they may
     * contain malicious JavaScript. In a similar fashion PDF is not on this list
     * as their parsers commonly contain vulnerabilities which can be exploited.
     */
    mimeInlineBrowserWhitelist: Set<string>;
    registerPath(path: string, handler: RouteHandler): void;
    /**
     * Read data from the DataStore and send the stream.
     */
    send(req: http.IncomingMessage, res: http.ServerResponse): Promise<stream.Writable | void>;
    /**
     * filterContentType returns the values for the Content-Type and
     * Content-Disposition headers for a given upload. These values should be used
     * in responses for GET requests to ensure that only non-malicious file types
     * are shown directly in the browser. It will extract the file name and type
     * from the "filename" and "filetype".
     * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
     */
    filterContentType(stats: Upload): {
        contentType: string;
        contentDisposition: string;
    };
    /**
     * Convert string to quoted string literals
     */
    quote(value: string): string;
}
//# sourceMappingURL=GetHandler.d.ts.map
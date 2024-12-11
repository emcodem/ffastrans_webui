import { BaseHandler } from './BaseHandler';
import type http from 'node:http';
import { type CancellationContext } from '@tus/utils';
export declare class PatchHandler extends BaseHandler {
    /**
     * Write data to the DataStore and return the new offset.
     */
    send(req: http.IncomingMessage, res: http.ServerResponse, context: CancellationContext): Promise<http.ServerResponse<http.IncomingMessage>>;
}
//# sourceMappingURL=PatchHandler.d.ts.map
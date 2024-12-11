import { BaseHandler } from './BaseHandler';
import { type CancellationContext } from '@tus/utils';
import type http from 'node:http';
export declare class HeadHandler extends BaseHandler {
    send(req: http.IncomingMessage, res: http.ServerResponse, context: CancellationContext): Promise<http.ServerResponse<http.IncomingMessage>>;
}
//# sourceMappingURL=HeadHandler.d.ts.map
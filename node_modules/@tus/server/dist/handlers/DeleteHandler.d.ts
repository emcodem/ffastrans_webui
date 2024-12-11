import { BaseHandler } from './BaseHandler';
import { type CancellationContext } from '@tus/utils';
import type http from 'node:http';
export declare class DeleteHandler extends BaseHandler {
    send(req: http.IncomingMessage, res: http.ServerResponse, context: CancellationContext): Promise<http.ServerResponse<http.IncomingMessage>>;
}
//# sourceMappingURL=DeleteHandler.d.ts.map
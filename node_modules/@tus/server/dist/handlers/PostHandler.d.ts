import { BaseHandler } from './BaseHandler';
import { type DataStore, type CancellationContext } from '@tus/utils';
import type http from 'node:http';
import type { ServerOptions, WithRequired } from '../types';
export declare class PostHandler extends BaseHandler {
    options: WithRequired<ServerOptions, 'namingFunction'>;
    constructor(store: DataStore, options: ServerOptions);
    /**
     * Create a file in the DataStore.
     */
    send(req: http.IncomingMessage, res: http.ServerResponse, context: CancellationContext): Promise<http.ServerResponse<http.IncomingMessage>>;
}
//# sourceMappingURL=PostHandler.d.ts.map
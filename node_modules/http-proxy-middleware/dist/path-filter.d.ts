import type * as http from 'node:http';
import type { Filter } from './types';
export declare function matchPathFilter<TReq = http.IncomingMessage>(pathFilter: Filter<TReq> | undefined, uri: string | undefined, req: http.IncomingMessage): boolean;

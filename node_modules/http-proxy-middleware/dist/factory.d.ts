import type * as http from 'node:http';
import type { NextFunction, Options, RequestHandler } from './types';
export declare function createProxyMiddleware<TReq = http.IncomingMessage, TRes = http.ServerResponse, TNext = NextFunction>(options: Options<TReq, TRes>): RequestHandler<TReq, TRes, TNext>;

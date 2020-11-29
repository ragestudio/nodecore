/// <reference types="express-serve-static-core" />
/// <reference types="multer" />
/// <reference types="node" />
import { Express, RequestHandler } from 'express';
import { Options as ProxyOptions, RequestHandler as ProxyRequestHandler, Filter as ProxyFilter } from 'http-proxy-middleware';
import * as http from 'http';
import { ServerOptions } from 'spdy';
import { CompressionOptions } from 'compression';
import { Connection, Server as SocketServer } from 'sockjs';
interface IServerProxyConfigItem extends ProxyOptions {
    path?: string | string[];
    context?: string | string[] | ProxyFilter;
    bypass?: (req: Express.Request, res: Express.Response, proxyConfig: IServerProxyConfigItem) => string | null;
}
declare type IServerProxyConfig = IServerProxyConfigItem | Record<string, IServerProxyConfigItem> | (IServerProxyConfigItem | (() => IServerProxyConfigItem))[] | null;
export interface IHttps extends ServerOptions {
}
export interface IServerOpts {
    afterMiddlewares?: RequestHandler<any>[];
    beforeMiddlewares?: RequestHandler<any>[];
    compilerMiddleware?: RequestHandler<any> | null;
    https?: IHttps | boolean;
    headers?: {
        [key: string]: string;
    };
    host?: string;
    port?: number;
    compress?: CompressionOptions | boolean;
    proxy?: IServerProxyConfig;
    onListening?: {
        ({ port, hostname, listeningApp, server, }: {
            port: number;
            hostname: string;
            listeningApp: http.Server;
            server: Server;
        }): void;
    };
    onConnection?: (param: {
        connection: Connection;
        server: Server;
    }) => void;
    onConnectionClose?: (param: {
        connection: Connection;
    }) => void;
    writeToDisk?: boolean | ((filePath: string) => boolean);
}
declare class Server {
    app: Express;
    opts: Required<IServerOpts>;
    socketServer?: SocketServer;
    listeningApp: http.Server;
    listeninspdygApp: http.Server;
    sockets: Connection[];
    socketProxies: ProxyRequestHandler[];
    constructor(opts: IServerOpts);
    private getHttpsOptions;
    setupFeatures(): void;
    /**
     * response headers
     */
    setupHeaders(): void;
    /**
     * dev server compress to gzip assets
     */
    setupCompress(): void;
    deleteRoutes(): void;
    /**
     * proxy middleware for dev
     * not coupled with build tools (like webpack, rollup, ...)
     */
    setupProxy(proxyOpts?: IServerProxyConfig, isWatch?: boolean): void;
    sockWrite({ sockets, type, data, }: {
        sockets?: Connection[];
        type: string;
        data?: string | object;
    }): void;
    createServer(): void;
    listen({ port, hostname, }: {
        port?: number;
        hostname: string;
    }): Promise<{
        port: number;
        hostname: string;
        listeningApp: http.Server;
        server: Server;
    }>;
    createSocketServer(): void;
}
export default Server;
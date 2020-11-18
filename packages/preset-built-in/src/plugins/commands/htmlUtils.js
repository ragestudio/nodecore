import { extname, join } from 'path';
import { existsSync } from 'fs';
import { lodash } from '@nodecorejs/utils';
import assert from 'assert';
export function chunksToFiles(opts) {
    let chunksMap = {};
    if (opts.chunks) {
        chunksMap = opts.chunks.reduce((memo, chunk) => {
            const key = chunk.name || chunk.id;
            if (key && chunk.files) {
                chunk.files.forEach((file) => {
                    if (!file.includes('.hot-update')) {
                        memo[`${key}${extname(file)}`] = file;
                    }
                });
            }
            return memo;
        }, {});
    }
    const cssFiles = [];
    const jsFiles = [];
    const headJSFiles = [];
    const htmlChunks = opts.htmlChunks.map((htmlChunk) => {
        return lodash.isPlainObject(htmlChunk) ? htmlChunk : { name: htmlChunk };
    });
    htmlChunks.forEach(({ name, headScript }) => {
        const cssFile = opts.noChunk ? `${name}.css` : chunksMap[`${name}.css`];
        if (cssFile) {
            cssFiles.push(cssFile);
        }
        const jsFile = opts.noChunk ? `${name}.js` : chunksMap[`${name}.js`];
        assert(jsFile, `chunk of ${name} not found.`);
        if (headScript) {
            headJSFiles.push(jsFile);
        }
        else {
            jsFiles.push(jsFile);
        }
    });
    return {
        cssFiles,
        jsFiles,
        headJSFiles,
    };
}
export function getHtmlGenerator({ api }) {
    function getDocumentTplPath() {
        const docPath = join(api.paths.absPagesPath, 'document.ejs');
        return existsSync(docPath) ? docPath : '';
    }
    class Html extends api.Html {
        constructor() {
            super({
                config: api.config,
                tplPath: getDocumentTplPath(),
            });
        }
        async getContent(args) {
            async function applyPlugins(opts) {
                return await api.applyPlugins({
                    key: opts.key,
                    type: api.ApplyPluginsType.add,
                    initialValue: opts.initialState || [],
                    args: {
                        route: args.route,
                    },
                });
            }
            let routerBaseStr = JSON.stringify(api.config.base);
            let publicPathStr = JSON.stringify(api.config.publicPath);
            if (api.config.exportStatic?.dynamicRoot) {
                routerBaseStr = `location.pathname.split('/').slice(0, -${args.route.path.split('/').length - 1}).concat('').join('/')`;
                publicPathStr = `location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + window.routerBase`;
            }
            publicPathStr = `window.resourceBaseUrl || ${publicPathStr};`;
            publicPathStr = await api.applyPlugins({
                key: 'modifyPublicPathStr',
                type: api.ApplyPluginsType.modify,
                initialValue: publicPathStr,
                args: {
                    route: args.route,
                },
            });
            const htmlChunks = await api.applyPlugins({
                key: 'modifyHTMLChunks',
                type: api.ApplyPluginsType.modify,
                initialValue: api.config.chunks || ['umi'],
                args: {
                    route: args.route,
                    chunks: args.chunks,
                },
            });
            const { cssFiles, jsFiles, headJSFiles } = chunksToFiles({
                htmlChunks,
                chunks: args.chunks,
                noChunk: args.noChunk,
            });
            return await super.getContent({
                route: args.route,
                cssFiles,
                headJSFiles,
                jsFiles,
                headScripts: await applyPlugins({
                    key: 'addHTMLHeadScripts',
                    initialState: [
                        {
                            content: `window.routerBase = ${routerBaseStr};`,
                        },
                        api.config.runtimePublicPath && {
                            content: `window.publicPath = ${publicPathStr};`,
                        },
                    ].filter(Boolean),
                }),
                links: await applyPlugins({
                    key: 'addHTMLLinks',
                }),
                metas: await applyPlugins({
                    key: 'addHTMLMetas',
                }),
                scripts: await applyPlugins({
                    key: 'addHTMLScripts',
                }),
                styles: await applyPlugins({
                    key: 'addHTMLStyles',
                }),
                // @ts-ignore
                async modifyHTML(memo, args) {
                    return await api.applyPlugins({
                        key: 'modifyHTML',
                        type: api.ApplyPluginsType.modify,
                        initialValue: memo,
                        args,
                    });
                },
            });
        }
        async getRouteMap() {
            const routes = await api.getRoutes();
            const flatRoutes = getFlatRoutes({ routes });
            return flatRoutes.map((route) => {
                // @ts-ignore
                const file = this.getHtmlPath(route.path);
                return {
                    route,
                    file,
                };
            });
        }
    }
    return new Html();
}
/**
 * flatten routes using routes config
 * @param opts
 */
export function getFlatRoutes(opts) {
    return opts.routes.reduce((memo, route) => {
        const { routes, path } = route;
        if (path && !path.includes('?')) {
            memo.push(route);
        }
        if (routes) {
            memo = memo.concat(getFlatRoutes({
                routes,
            }));
        }
        return memo;
    }, []);
}
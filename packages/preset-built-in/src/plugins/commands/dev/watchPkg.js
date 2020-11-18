import { join } from 'path';
import { chokidar, winPath, lodash } from '@nodecorejs/utils';
import { existsSync, readFileSync } from 'fs';
import { isPluginOrPreset, PluginType } from '@nodecorejs/core';
function getUmiPlugins(opts) {
    return Object.keys({
        ...opts.pkg.dependencies,
        ...opts.pkg.devDependencies,
    }).filter((name) => {
        return (isPluginOrPreset(PluginType.plugin, name) ||
            isPluginOrPreset(PluginType.preset, name));
    });
}
function getUmiPluginsFromPkgPath(opts) {
    let pkg = {};
    if (existsSync(opts.pkgPath)) {
        try {
            pkg = JSON.parse(readFileSync(opts.pkgPath, 'utf-8'));
        }
        catch (e) { }
    }
    return getUmiPlugins({ pkg });
}
export function watchPkg(opts) {
    const pkgPath = join(opts.cwd, 'package.json');
    const plugins = getUmiPluginsFromPkgPath({ pkgPath });
    const watcher = chokidar.watch(pkgPath, {
        ignoreInitial: true,
    });
    watcher.on('all', () => {
        const newPlugins = getUmiPluginsFromPkgPath({ pkgPath });
        if (!lodash.isEqual(plugins, newPlugins)) {
            // 已经重启了，只处理一次就够了
            opts.onChange();
        }
    });
    return () => {
        watcher.close();
    };
}
export function watchPkgs(opts) {
    const unwatchs = [watchPkg({ cwd: opts.cwd, onChange: opts.onChange })];
    if (winPath(opts.cwd) !== winPath(process.cwd())) {
        unwatchs.push(watchPkg({ cwd: process.cwd(), onChange: opts.onChange }));
    }
    return () => {
        unwatchs.forEach((unwatch) => {
            unwatch();
        });
    };
}

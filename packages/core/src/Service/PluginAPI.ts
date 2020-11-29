import assert from 'assert';
import * as utils from '@nodecorejs/utils';
import Logger from '../Logger/Logger';
import Service from './Service';
import { isValidPlugin, pathToObj } from './utils/pluginUtils';
import { EnableBy, PluginType, ServiceStage } from './enums';
import { ICommand, IHook, IPlugin, IPluginConfig, IPreset } from './types';
import Html from '../Html/Html';

interface IOpts {
  id: string;
  key: string;
  service: Service;
}

export default class PluginAPI {
  id: string;
  key: string;
  service: Service;
  Html: typeof Html;
  utils: typeof utils;
  logger: Logger;

  constructor(opts: IOpts) {
    this.id = opts.id;
    this.key = opts.key;
    this.service = opts.service;
    this.utils = utils;
    this.Html = Html;
    this.logger = new Logger(`nodecore:plugin:${this.id || this.key}`);
  }

  // TODO: reversed keys
  describe({
    id,
    key,
    config,
    enableBy,
  }: {
    id?: string;
    key?: string;
    config?: IPluginConfig;
    enableBy?: EnableBy | (() => boolean);
  } = {}) {
    const { plugins } = this.service;
    // this.id and this.key is generated automatically
    // so we need to diff first
    if (id && this.id !== id) {
      if (plugins[id]) {
        const name = plugins[id].isPreset ? 'preset' : 'plugin';
        throw new Error(
          `api.describe() failed, ${name} ${id} is already registered by ${plugins[id].path}.`,
        );
      }
      plugins[id] = plugins[this.id];
      plugins[id].id = id;
      delete plugins[this.id];
      this.id = id;
    }
    if (key && this.key !== key) {
      this.key = key;
      plugins[this.id].key = key;
    }

    if (config) {
      plugins[this.id].config = config;
    }

    plugins[this.id].enableBy = enableBy || EnableBy.register;
  }

  register(hook: IHook) {
    assert(
      hook.key && typeof hook.key === 'string',
      `api.register() failed, hook.key must supplied and should be string, but got ${hook.key}.`,
    );
    assert(
      hook.fn && typeof hook.fn === 'function',
      `api.register() failed, hook.fn must supplied and should be function, but got ${hook.fn}.`,
    );
    this.service.hooksByPluginId[this.id] = (
      this.service.hooksByPluginId[this.id] || []
    ).concat(hook);
  }

  registerCommand(command: ICommand) {
    const { name, alias } = command;
    assert(
      !this.service.commands[name],
      `api.registerCommand() failed, the command ${name} is exists.`,
    );
    this.service.commands[name] = command;
    if (alias) {
      this.service.commands[alias] = name;
    }
  }

  registerPresets(presets: (IPreset | string)[]) {
    assert(
      this.service.stage === ServiceStage.initPresets,
      `api.registerPresets() failed, it should only used in presets.`,
    );
    assert(
      Array.isArray(presets),
      `api.registerPresets() failed, presets must be Array.`,
    );
    const extraPresets = presets.map((preset) => {
      return isValidPlugin(preset as any)
        ? (preset as IPreset)
        : pathToObj({
            type: PluginType.preset,
            path: preset as string,
            cwd: this.service.cwd,
          });
    });

    this.service._extraPresets.splice(0, 0, ...extraPresets);
  }

  registerPlugins(plugins: (IPlugin | string)[]) {
    assert(
      this.service.stage === ServiceStage.initPresets ||
        this.service.stage === ServiceStage.initPlugins,
      `api.registerPlugins() failed, it should only be used in registering stage.`,
    );
    assert(
      Array.isArray(plugins),
      `api.registerPlugins() failed, plugins must be Array.`,
    );
    const extraPlugins = plugins.map((plugin) => {
      return isValidPlugin(plugin as any)
        ? (plugin as IPreset)
        : pathToObj({
            type: PluginType.plugin,
            path: plugin as string,
            cwd: this.service.cwd,
          });
    });
    if (this.service.stage === ServiceStage.initPresets) {
      this.service._extraPlugins.push(...extraPlugins);
    } else {
      this.service._extraPlugins.splice(0, 0, ...extraPlugins);
    }
  }

  registerMethod({
    name,
    fn,
    exitsError = true,
  }: {
    name: string;
    fn?: Function;
    exitsError?: boolean;
  }) {
    if (this.service.pluginMethods[name]) {
      if (exitsError) {
        throw new Error(
          `api.registerMethod() failed, method ${name} is already exist.`,
        );
      } else {
        return;
      }
    }
    this.service.pluginMethods[name] =
      fn ||
      function (fn: Function) {
        const hook = {
          key: name,
          ...(utils.lodash.isPlainObject(fn) ? fn : { fn }),
        };
        // @ts-ignore
        this.register(hook);
      };
  }

  skipPlugins(pluginIds: string[]) {
    pluginIds.forEach((pluginId) => {
      this.service.skipPluginIds.add(pluginId);
    });
  }
}

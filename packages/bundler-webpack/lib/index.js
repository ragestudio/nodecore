"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "BundlerConfigType", {
  enumerable: true,
  get: function get() {
    return _types().BundlerConfigType;
  }
});
Object.defineProperty(exports, "webpack", {
  enumerable: true,
  get: function get() {
    return _webpack().default;
  }
});
exports.Bundler = void 0;

function _react() {
  const data = _interopRequireDefault(require("react"));

  _react = function _react() {
    return data;
  };

  return data;
}

function _types() {
  const data = require("@nodecorejs/types");

  _types = function _types() {
    return data;
  };

  return data;
}

function _webpack() {
  const data = _interopRequireDefault(require("webpack"));

  _webpack = function _webpack() {
    return data;
  };

  return data;
}

function _webpackDevMiddleware() {
  const data = _interopRequireDefault(require("webpack-dev-middleware"));

  _webpackDevMiddleware = function _webpackDevMiddleware() {
    return data;
  };

  return data;
}

function _utils() {
  const data = require("@nodecorejs/utils");

  _utils = function _utils() {
    return data;
  };

  return data;
}

var _getConfig = _interopRequireDefault(require("./getConfig/getConfig"));

function _path() {
  const data = require("path");

  _path = function _path() {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

class Bundler {
  constructor({
    cwd,
    config
  }) {
    /**
     * get ignored watch dirs regexp, for test case
     */
    this.getIgnoredWatchRegExp = () => {
      const outputPath = this.config.outputPath;
      const absOutputPath = (0, _utils().winPath)((0, _path().join)(this.cwd, outputPath, '/')); // need ${sep} after outputPath

      return process.env.WATCH_IGNORED === 'none' ? undefined : new RegExp(process.env.WATCH_IGNORED || `(node_modules|${absOutputPath})`);
    };

    this.cwd = cwd;
    this.config = config;
  }

  getConfig(opts) {
    var _this = this;

    return _asyncToGenerator(function* () {
      return yield (0, _getConfig.default)(_objectSpread(_objectSpread({}, opts), {}, {
        cwd: _this.cwd,
        config: _this.config
      }));
    })();
  }

  build({
    bundleConfigs,
    bundleImplementor = _webpack().default
  }) {
    return _asyncToGenerator(function* () {
      return new Promise((resolve, reject) => {
        const compiler = bundleImplementor(bundleConfigs);
        compiler.run((err, stats) => {
          if (err || stats.hasErrors()) {
            try {
              console.log(stats.toString('errors-only'));
            } catch (e) {}

            console.error(err);
            return reject(new Error('build failed'));
          } // @ts-ignore


          resolve({
            stats
          });
        });
      });
    })();
  }

  setupDevServerOpts({
    bundleConfigs,
    bundleImplementor = _webpack().default
  }) {
    const compiler = bundleImplementor(bundleConfigs);
    const devServer = this.config.devServer; // @ts-ignore

    const compilerMiddleware = (0, _webpackDevMiddleware().default)(compiler, {
      // must be /, otherwise it will exec next()
      publicPath: '/',
      logLevel: 'silent',
      writeToDisk: devServer && (devServer === null || devServer === void 0 ? void 0 : devServer.writeToDisk),
      watchOptions: {
        // not watch outputPath dir and node_modules
        ignored: this.getIgnoredWatchRegExp()
      }
    });

    function sendStats({
      server,
      sockets,
      stats
    }) {
      server.sockWrite({
        sockets,
        type: 'hash',
        data: stats.hash
      });

      if (stats.errors.length > 0) {
        server.sockWrite({
          sockets,
          type: 'errors',
          data: stats.errors
        });
      } else if (stats.warnings.length > 0) {
        server.sockWrite({
          sockets,
          type: 'warnings',
          data: stats.warnings
        });
      } else {
        server.sockWrite({
          sockets,
          type: 'ok'
        });
      }
    }

    function getStats(stats) {
      return stats.toJson({
        all: false,
        hash: true,
        assets: true,
        warnings: true,
        errors: true,
        errorDetails: false
      });
    }

    let _stats = null;
    return {
      compilerMiddleware,
      onListening: ({
        server
      }) => {
        function addHooks(compiler) {
          const _compiler$hooks = compiler.hooks,
                compile = _compiler$hooks.compile,
                invalid = _compiler$hooks.invalid,
                done = _compiler$hooks.done;
          compile.tap('umi-dev-server', () => {
            server.sockWrite({
              type: 'invalid'
            });
          });
          invalid.tap('umi-dev-server', () => {
            server.sockWrite({
              type: 'invalid'
            });
          });
          done.tap('umi-dev-server', stats => {
            sendStats({
              server,
              sockets: server.sockets,
              stats: getStats(stats)
            });
            _stats = stats;
          });
        }

        if (compiler.compilers) {
          compiler.compilers.forEach(addHooks);
        } else {
          addHooks(compiler);
        }
      },
      onConnection: ({
        connection,
        server
      }) => {
        if (_stats) {
          sendStats({
            server,
            sockets: [connection],
            stats: getStats(_stats)
          });
        }
      }
    };
  }

}

exports.Bundler = Bundler;
Bundler.id = 'webpack';
Bundler.version = 4;
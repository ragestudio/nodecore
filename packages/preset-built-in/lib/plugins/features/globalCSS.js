"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _react() {
  const data = _interopRequireDefault(require("react"));

  _react = function _react() {
    return data;
  };

  return data;
}

function _path() {
  const data = require("path");

  _path = function _path() {
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

var _utils2 = require("../utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = (0, _utils().createDebug)('umi:preset-build-in:global-css');

var _default = api => {
  const paths = api.paths,
        winPath = api.utils.winPath;
  const _paths$absSrcPath = paths.absSrcPath,
        absSrcPath = _paths$absSrcPath === void 0 ? '' : _paths$absSrcPath,
        _paths$absTmpPath = paths.absTmpPath,
        absTmpPath = _paths$absTmpPath === void 0 ? '' : _paths$absTmpPath;
  const files = ['global.css', 'global.less', 'global.scss', 'global.sass', 'global.styl', 'global.stylus'];
  const globalCSSFile = (0, _utils2.getGlobalFile)({
    absSrcPath,
    files
  });
  debug('globalCSSFile', globalCSSFile);
  api.addEntryCodeAhead(() => `${globalCSSFile.map(file => `require('${winPath((0, _path().relative)(absTmpPath, file))}');`).join('')}`);
};

exports.default = _default;
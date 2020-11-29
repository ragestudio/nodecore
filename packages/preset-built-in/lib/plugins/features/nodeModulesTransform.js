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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = api => {
  api.describe({
    key: 'nodeModulesTransform',
    config: {
      default: {
        type: 'all',
        exclude: []
      },

      schema(joi) {
        return joi.object({
          type: joi.string().valid('all', 'none'),
          exclude: joi.array().items(joi.string())
        });
      }

    }
  });
};

exports.default = _default;
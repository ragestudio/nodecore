let ex = require('./dist/cjs');
try {
  const coreExports = require('@@/core/coreExports');
  ex = Object.assign(ex, coreExports);
} catch (e) {}
module.exports = ex;
const { verbosity } = require('@corenode/utils')

module.exports = function (...args) {
    const v = verbosity.options({ method: `[${this.id ?? "out"}]` })
    v.log(...args)
}
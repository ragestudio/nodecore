import { dirname } from 'path';
import { Service as CoreService } from '@nodecorejs/core';
class Service extends CoreService {
    constructor(opts) {
        process.env.UMI_VERSION = require('../package').version;
        process.env.UMI_DIR = dirname(require.resolve('../package'));
        super({
            ...opts,
            presets: [
                require.resolve('@nodecorejs/preset-built-in'),
                ...(opts.presets || []),
            ],
            plugins: [require.resolve('./plugins/umiAlias'), ...(opts.plugins || [])],
        });
    }
}
export { Service };
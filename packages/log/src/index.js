import log4js from 'log4js'
import { getDevRuntimeEnv } from '@nodecorejs/dot-runtime'

export function dump(log) {
    const filename = getDevRuntimeEnv().outputLogFilename ?? "logs_dump.log"
    log4js.configure({
        appenders: {
            logs: { type: "file", filename: filename },
        },
        categories: {
            default: { appenders: ["logs"], level: "debug" }
        }
    })
    log4js.getLogger("logs").debug(log)

    return this    
}

export default dump
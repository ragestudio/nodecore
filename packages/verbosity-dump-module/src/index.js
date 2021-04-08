import { getProjectEnv } from 'corenode'
import { createLogger, format, transports } from 'winston'

const { combine, timestamp, label, printf } = format

const filename = getProjectEnv().devRuntime?.outputLogFilename ?? "logs_dump.log"

export default ({ level, stack }) => createLogger({
    format: combine(
        label({ label: level }),
        timestamp(),
        printf(({ message, label, timestamp }) => {
            return `> ${timestamp} ${(stack?.method ?? false) ? `${stack.method}` : ''}[${label ?? "log"}] : ${message}`
        })
    ),
    transports: [
        new transports.File({ filename }),
    ],
})
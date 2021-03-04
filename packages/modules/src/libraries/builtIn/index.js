import { Aliaser, Globals } from "@nodecorejs/builtin-lib"
import * as DotRuntime from "@ragestudio/nodecorejs"

module.exports = {
    load: {
        DotRuntime,
        Aliaser,
        Globals,
        cli: {
            add: (command) => {
                if (typeof (command) == "object") {
                    if (typeof (global.nodecore_cli.custom) == "undefined") {
                        global.nodecore_cli.custom = []
                    }
                    global.nodecore_cli.custom.push(command)
                }
            },
            // TODO
            call: (command) => {
                return false
            }
        },
        // TODO
        registerModule: () => {

        },
        // TODO
        unloadModule: () => {

        },
    }
}
import axios from 'axios'
import { verbosity } from '@nodecorejs/utils'
import { getRuntimeEnv } from '@nodecorejs/dot-runtime'
import { Mutex } from 'async-mutex'

import http from 'http'
import express from 'express'

let app = express()
const httpServer = http.createServer(app)

const WebSocketClient = require('websocket').client
const clientLock = new Mutex()

try {
    if (!global.cloudlink) {
        global.cloudlink = {
            origin: null,
            nodes: {}
        }
    }

    const fromRuntime = getRuntimeEnv().cloudlink
    if (fromRuntime) {
        global.cloudlink = { ...global.cloudlink, ...fromRuntime }
    }
} catch (error) {
    verbosity.error(error)
}

function stopExpress(params) {
    httpServer.close()
}

function createCloudLinkServer(port, endpoints, Controllers = {}, Middlewares = {}) {
    try {
        if (typeof (endpoints) !== "object") {
            console.error("Invalid endpoints")
            return false
        }
        endpoints.forEach((api) => {
            if (typeof (api.path) == "undefined") {
                console.log(`Path is required!`)
                return false
            }
            if (typeof (Controllers[api.controller]) == "undefined") {
                console.log(`Controller (${api.controller}) not loaded!`)
                return false
            }
            let model = [`/${api.path}`]

            let thisController = Controllers[api.controller]
            let thisMiddleware = Middlewares[api.middleware]

            if (typeof (api.exec) !== "undefined") {
                thisController = thisController[api.exec]
            } else {
                thisController = thisController.get
            }

            if (thisController) {
                model.push(thisController)
            }
            if (thisMiddleware) {
                model.push(thisMiddleware)
            }
            app[api.method.toLowerCase() ?? "get"](...model)
        })
    } catch (error) {
        console.error(error)
        return false
    }

    httpServer.listen(port, () => {
        verbosity.log(`CloudLink server ready!`)
    })
}

function register(params) {
    const registerTarget = `${params.https ? "https" : "http"}://${params.origin}${params.originPort ? `:${params.originPort}` : ''}/register`
    createCloudLinkServer(params.listenPort, params.endpoints, params.controllers)

    axios(registerTarget, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        data: {
            origin_key: params.origin_key,
            id: params.id,
            policy: params.policy ?? "strict",
            endpoints: params.endpoints,
            listenPort: params.listenPort
        }
    })
        .then((res) => {
            let client = new WebSocketClient()

            client.on('connectFailed', (error) => {
                console.log('WS Connect Error: ' + error.toString())
            })

            client.on('connect', (socket) => {
                socket.on('error', (error) => {
                    console.log("Connection Error: " + error.toString())
                })
                socket.on('close', () => {
                    console.log('Connection Closed')
                    stopExpress()
                })
            })

            client.connect(`ws://${params.origin}:${params.originPort}`)
        })
        .catch((err) => {
            console.error(`[Error ${err.response.status}] ${err.response.data}`)
        })
        .then(() => {

        })
    return this
}

async function init(params) {
    const instance = await new Promise(async (resolve, reject) => {
        if (params.origin) {
            global.cloudlink.origin = params.origin
        }
        const lock = await clientLock.acquire()
        const res = await axios.get(global.cloudlink.origin)

        global.cloudlink.nodes = res.data
        lock()

        return resolve(this)
    })
    return instance
}

function plug(socket, opt) {
    const protocol = opt?.https ? "https://" : "http://"
    const node = global.cloudlink.nodes[socket]

    if (typeof (node) == "undefined") {
        verbosity.error(`Node not available`)
        return this
    }
    const endpoints = node.endpoints

    let instance = {}

    endpoints.forEach(endpoint => {
        instance[endpoint.path] = async (params) => {
            const request = await axios(`${protocol}${node.remote}:${node.listenPort}/${endpoint.path}`, {
                method: endpoint.method,
                data: params
            })

            return request.data
        }
    })

    return instance
}

export default {
    init, register, plug
}
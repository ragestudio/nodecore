
import path from 'path'
import fs from 'fs'
import cliProgress from 'cli-progress'

import { prettyTable } from '@corenode/utils'

import rimraf from 'rimraf'
import vfs from 'vinyl-fs'
import through from 'through2'

import * as lib from './lib'

let env = {
  babel: {}
}
let builderErrors = Array()

let includedSources = null
let skipedSources = null

const maximunLenghtErrorShow = (Number(process.stdout.columns) / 2) - 10

function handleError(err, index, dir) {
  builderErrors.push({ task: index, message: err, dir: dir })
}

//  >> MAIN <<
const outExt = '.js'
const fileExtWatch = ['.js', '.ts']

function canRead(dir) {
  try {
    fs.accessSync(dir)
    return true
  } catch (error) {
    return false
  }
}

export function transcompile(payload) {
  return new Promise((resolve, reject) => {
    let { dir, opts, ticker } = payload
    let options = {
      outDir: 'dist',
      agent: 'babel' // default
    }

    if (typeof (opts) !== "undefined") {
      options = { ...options, ...opts }
    }

    const src = path.resolve(options.from, `${dir}/src`)
    const out = path.resolve(options.from, `${dir}/${options.outDir}`)

    const sources = [
      path.join(src, '**/*'),
      `!${path.join(src, '**/*.test.js')}`,
    ]

    function handleTicker() {
      try {
        if (typeof (ticker) == "function") ticker()
      } catch (error) {
        // terrible
      }
    }

    if (fs.existsSync(out)) {
      rimraf.sync(out)
    }

    try {
      const stream = vfs.src(sources, {
        allowEmpty: true
      })
        .pipe(through.obj((file, codec, callback) => {
          function passThrough() {
            handleTicker()
            return callback(null, file)
          }

          if (!path.extname(file.path)) {
            if (canRead(file.path)) {
              return passThrough()
            }

            const oldFilepath = file.path
            file.path = `${file.path}/index${outExt}`

            if (fs.existsSync(file.path) && !canRead(file.path)) {
              file.path = `${oldFilepath}/${path.basename(oldFilepath)}`
            }
          }

          if (Array.isArray(skipedSources)) {
            if (skipedSources.includes(path.resolve(file.path))) {
              return passThrough()
            }
          }

          if (fileExtWatch.includes(path.extname(file.path))) {
            // set env
            env.babel.filename = file.path

            // exec babel agent
            lib.agents[options.agent](file.contents, { ...env.babel, filename: file.path })
              .then((_output) => {
                file.contents = Buffer.from(_output.code)
                file.path = file.path.replace(path.extname(file.path), outExt)

                return passThrough()
              })
              .catch((err) => {
                handleError(err.message, 0, path.basename(file.path))

                return passThrough()
              })
          } else {
            // ignore and return callback for stream file
            handleError(`[${path.extname(file.path)}] type extension not included, ignoring...`, 0, path.basename(file.path))
            return passThrough()
          }
        }))
        .pipe(vfs.dest(out))

      stream.on('end', () => {
        return resolve(true)
      })

      stream.on('error', (err) => {
        return reject(err)
      })

    } catch (error) {
      return reject(error)
    }
  })
}

function readDir(_path) {
  return fs.readdirSync(_path).filter((dir) => dir.charAt(0) !== '.')
}

export function buildProject(opts = {}) {
  return new Promise((resolve, reject) => {
    const tasks = {}

    const cliEnabled = opts?.cliui ? true : false
    const multibarEnabled = cliEnabled

    const from = opts.from = opts?.from ?? process.cwd()
    const packagesPath = path.resolve(from, 'packages')
    const isProjectMode = fs.existsSync(packagesPath)

    let builderCount = Number(0)
    let multibar = null

    let packages = isProjectMode ? readDir(packagesPath) : ["./"]

    try {
      const projectEnv = lib.getBuilderEnv(opts.rcfile ?? from)
      if (projectEnv) {
        env = { ...projectEnv }
      }
    } catch (error) {
      handleError(error.message)
    }

    // parse options from ".builder" config file
    const { skip, ignore, include } = env

    if (skip && Array.isArray(skip)) {
      if (skip.length > 0) {
        skipedSources = env.skip.map((source) => {
          return path.resolve(source)
        })
      }
    }

    if (ignore) {
      if (ignore.length > 0) {
        ignore.forEach((source) => {
          packages = packages.filter(pkg => pkg !== source)
        })
      }
    }

    // list all packages dirs inside project
    let dirs = packages.map((name) => {
      return isProjectMode ? `./packages/${name}` : `${name}`
    })

    if (include) {
      includedSources = include
      const regex = /[*]/

      if (Array.isArray(include)) {
        include.forEach((source) => {
          let absoluteDir = path.resolve(from, source)
          const res = regex.exec(absoluteDir)

          if (res) {
            absoluteDir = path.resolve(absoluteDir.slice(0, res.index))
            if (fs.existsSync(absoluteDir)) {
              readDir(absoluteDir).forEach((entry) => {
                dirs.push(path.resolve(absoluteDir, entry))
              })
            }
          } else {
            dirs.push(absoluteDir)
          }

        })
      }
    }

    function handleFinish() {
      if (multibarEnabled) {
        multibar.stop()
      }

      if (Array.isArray(builderErrors) && builderErrors.length > 0) {
        const Logger = require("corenode/dist/logger")
        const log = new Logger({ id: "#BUILDER" })

        const pt = new prettyTable()
        const headers = ["TASK INDEX", "⚠️ ERROR", "PACKAGE"]
        const rows = []
        
        builderErrors.forEach((err) => {
          let obj = { ...err }
          log.dump("warn", `BUILD ERROR >> [${obj.task ?? "UNTASKED"}][${obj.dir}] >> ${obj.message}`)

          if (obj?.message?.length > maximunLenghtErrorShow) {
            obj.message = (String(obj.message).slice(0, (maximunLenghtErrorShow - 3)) + "...")
          }
          if (obj?.dir?.length > maximunLenghtErrorShow) {
            obj.dir = (String(obj.dir).slice(0, (maximunLenghtErrorShow - 3)) + "...")
          }
          rows.push([obj.task ?? "UNTASKED", obj.message ?? "Unknown error", obj.dir ?? "RUNTIME"])
        })

        pt.create(headers, rows)

        console.log(`\n⚠️  ERRORS / WARNINGS DURING BUILDING`)
        pt.print()
      }

      resolve()
    }

    function handleTicker(job) {
      if (multibarEnabled) {
        tasks[job].increment(1)
      }
    }

    function handleThen(job) {
      if (typeof job === "undefined") {
        return reject(`handleThen job not defined!`)
      }

      builderCount += 1

      if (multibarEnabled) {
        const task = tasks[job]
        const currentValue = task.value
        const totalValue = task.total

        if (currentValue != totalValue) {
          task.setTotal(currentValue)
        }
      }

      if (builderCount == dirs.length) {
        handleFinish()
      }
    }

    // >> MAIN <<
    try {
      if (cliEnabled) {
        if (multibarEnabled) {
          multibar = new cliProgress.MultiBar({
            forceRedraw: false,
            stopOnComplete: true,
            barsize: 20,
            clearOnComplete: false,
            hideCursor: true,
            format: '[{bar}] {percentage}% | {filename} | {value}/{total}'
          }, cliProgress.Presets.shades_grey)
        }
      }
    } catch (error) {
      handleError(error, "UNTASKED", "CLI INIT")
    }

    dirs.forEach((dir) => {
      const job = path.basename(dir)
      let sources = null

      try {
        const packagePath = path.resolve(from, `${dir}/src`)
        sources = lib.listAllFiles(packagePath)

        if (multibar && multibarEnabled) {
          tasks[job] = multibar.create(sources.length, 0)
          tasks[job].update(0, { filename: job })
        }
      } catch (error) {
        handleError(error, job, dir)
      }

      if (!sources) {
        return false
      }

      // start builder
      transcompile({ dir, opts, ticker: () => handleTicker(job) })
        .then((done) => {
          handleThen(job)
        })
        .catch((err) => {
          if (Array.isArray(err)) {
            err.forEach((error) => {
              handleError(error, job, dir)
            })
          } else {
            handleError(`${err}`, job, dir)
          }
        })

    })
  })
}

export default buildProject
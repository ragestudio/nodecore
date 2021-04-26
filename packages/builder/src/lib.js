import path from 'path'
import fs from 'fs'
const babel = require("@babel/core")

const babelConfig = {
  presets: [
    [
      require.resolve('@babel/preset-typescript'),
      {},
    ],
    [
      require.resolve('@babel/preset-env'),
      {
        targets: {
          node: 6
        }
      },
    ],
  ],
  plugins: [
    require.resolve('@babel/plugin-transform-runtime'),
    require.resolve('@babel/plugin-proposal-export-default-from'),
    require.resolve('@babel/plugin-proposal-do-expressions'),
    require.resolve('@babel/plugin-proposal-class-properties'),
  ],
}

export const agents = {
  babel: (contents, filepath, env) => {
    return new Promise((resolve, reject) => {
      try {
        let opts = env.babel ?? {}
        babel.transform(contents, { ...babelConfig, ...opts, filename: filepath }, (err, result) => {
          if (err) {
            return reject(err)
          }

          return resolve(result)
        })
      } catch (error) {
        return reject(error)
      }
    })
  }
}

export function listAllFiles(dir) {
  return fs.readdirSync(dir).reduce((list, file) => {
    const name = path.join(dir, file)
    const isDir = fs.statSync(name).isDirectory()

    return list.concat(isDir ? listAllFiles(name) : [name])
  }, [])
}

export function getBuilderEnv() {
  const envFile = path.resolve(process.cwd(), '.builder')

  return JSON.parse(fs.readFileSync(envFile, 'utf-8'))
}
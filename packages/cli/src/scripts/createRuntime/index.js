import path from 'path'
import execa from 'execa'
import fs from 'fs'
import process from 'process'
import inquirer from 'inquirer'

const saveRuntimeFile = path.resolve(process.cwd(), '.corenode')

import { getProjectEnv, getRootPackage } from 'corenode'

let runtimeEnv = getProjectEnv()
let pkgjson = getRootPackage() ?? {}

export function createRuntime() {
    let defData = runtimeEnv? runtimeEnv : pkgjson

    const prompts = [
        {
            name: "headPackage",
            type: "input",
            message: "Name of the headPackage >",
            default: defData.headPackage ?? "examplePKG"
        },
        {
            name: "originGit",
            type: "input",
            message: "Input the source of git uri >",
            default: defData.originGit ?? "https://github.com/me/awesomeApp"
        },
        {
            name: "create_projectScheme",
            message: "You want to create project directories scheme? >",
            type: "confirm"
        },
    ]

    inquirer.prompt(prompts)
        .then((answers)=> {
            if (!runtimeEnv) {
                return false
            }
            if (!answers.src) {
                // missing source directory path, re-enter try
                return false
            }

            runtimeEnv = {
                ...runtimeEnv,
                src: answers.src,
                devRuntime: {
                    headPackage: answers.headPackage,
                    originGit: answers.originGit
                }
            }

            fs.writeFile(saveRuntimeFile, JSON.stringify(runtimeEnv, null, "\t"), function (err) {
                if (err) throw err;
                console.log('✳ Saved runtime file! >', saveRuntimeFile)
            })

            if (answers.create_projectScheme) {
                const schemePath = path.resolve(process.cwd(), `./packages/${answers.headPackage}`)
                fs.mkdirSync(schemePath, { recursive: true })
                execa('corenode', ['bootstrap']).stdout.pipe(process.stdout)
            }
        })
        .catch((error) => {
            if (error.isTtyError) {
                // Prompt couldn't be rendered in the current environment
            } else {
                console.log(error)
            }
        });
}

export default createRuntime
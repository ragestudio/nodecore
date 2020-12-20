import path from 'path'
import execa from 'execa'
import fs from 'fs'
import process from 'process'
import inquirer from 'inquirer'

const saveRuntimeFile = path.resolve(process.cwd(), '.nodecore')

import { getRuntimeEnv } from '@nodecorejs/dot-runtime'

let runtimeEnv = getRuntimeEnv()

export function __initCreateRuntime() {
    const prompts = [
        {
            name: "headPackage",
            type: "input",
            message: "Name of the headPackage >",
            default: runtimeEnv.devRuntime.headPackage ?? "examplePKG"
        },
        {
            name: "originGit",
            type: "input",
            message: "Input the source of git uri >",
            default: runtimeEnv.devRuntime.originGit ?? "https://github.com/me/awesomeApp"
        },
        {
            name: "create_proyectScheme",
            message: "You want to create proyect directories scheme? >",
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

            if (answers.create_proyectScheme) {
                execa('mkdir', ['./packages']).stdout.pipe(process.stdout)
                execa('cd', ['./packages']).stdout.pipe(process.stdout)
                execa('mdkir', [`${answers.headPackage}`]).stdout.pipe(process.stdout)
                execa('nodecore', ['bootstrap']).stdout.pipe(process.stdout)
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
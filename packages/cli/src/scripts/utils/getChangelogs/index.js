import { htmlEscape } from 'escape-goat'
import git from '../git'

export async function getChangelogs(url, from) {
    if (!url) {
        throw new Error(`Please provide an git url`)
    }

    const lastest = await git.latestTagOrFirstCommit()
    const log = await git.commitLogFromRevision(from ?? lastest)

    if (!log) {
        throw new Error(`Get changelog failed, no new commits was found.`)
    }

    const commits = log.split('\n').map((commit) => {
        const splitIndex = commit.lastIndexOf(' ')
        return {
            message: commit.slice(0, splitIndex),
            id: commit.slice(splitIndex + 1),
        }
    })

    return commits.map((commit) => `- ${htmlEscape(commit.message)}  ${commit.id}`).join('\n')
}

export default getChangelogs
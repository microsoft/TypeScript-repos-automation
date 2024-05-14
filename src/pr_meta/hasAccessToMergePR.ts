import { Octokit, RestEndpointMethodTypes } from "@octokit/rest"
import { getContents } from "../util/getContents"
import { minimatch } from "minimatch"
import { Logger } from "../util/logger"

type PR = RestEndpointMethodTypes["pulls"]["get"]["response"]["data"];

/**
 * Checks if a user has access to merge via a comment
 *
 * @param commenterLogin the username of who we're checking if they can merge
 * @param octokit authed api for github
 * @param pr the JSON from a get request for a PR
 * @param logger logs
 */
export const hasAccessToMergePRs = async (commenterLogin: string, octokit: Octokit, pr: PR, logger: Logger) => {
  const codeownersText = await getCodeOwnersFileForRepo(octokit, pr)
  if (codeownersText === "") {
    logger.info("Skipping because there is no code-owners file in the repo")
    return false
  }

  const changedFiles = await getPRChangedFiles(octokit, pr)
  const codeOwners = getCodeOwnersInfo(codeownersText)

  const filesWhichArentOwned = getFilesNotOwnedByCodeOwner(commenterLogin, changedFiles, codeOwners)

  if (filesWhichArentOwned.length > 0) {
    logger.info(`- Bailing because not all files for ${commenterLogin} were covered by the codeowners for this review`)
    logger.info(`  Missing: ${filesWhichArentOwned.join(", ")}`)
    return false
  } else {
    logger.info("Accepting as reasonable to merge")
    return true
  }
}

// async function comm
export function getFilesNotOwnedByCodeOwner(commenterLogin: string, files: string[], codeOwners: CodeOwner[]) {
  const atUser = "@" + commenterLogin
  const activeCodeOwners = codeOwners.filter(c => c.usernames.includes(atUser))

  if (activeCodeOwners.length == 0) {
    // Couldn't find anything, so return all the files
    return files
  }

  // Make a copy of all matches, then loop through known codeowners removing anything which passes
  let matched = [...files]
  activeCodeOwners.forEach(owners => {
    matched.forEach((file, index) => {
      if (minimatch(file, owners.path)) {
        matched.splice(index, 1)
      }
    })
  })

  return matched
}

async function getPRChangedFiles(octokit: Octokit, webhook: PR) {
  // https://developer.github.com/v3/pulls/#list-pull-requests-files
  const repo = webhook.base.repo
  const options = octokit.pulls.listFiles.endpoint.merge({
    owner: repo.owner.login,
    repo: repo.name,
    pull_number: webhook.number,
  })

  const files = await octokit.paginate<RestEndpointMethodTypes["pulls"]["listFiles"]["response"]["data"][number]>(options)
  const fileStrings = files.map(f => `/${f.filename}`)
  return fileStrings
}

const getCodeOwnersFileForRepo = (api: Octokit, webhook: PR) => {
  const repo = webhook.base.repo
  try {
    return getContents(api, { owner: repo.owner.login, repo: repo.name, path: ".github/CODEOWNERS" })
  } catch (error) {
    return ""
  }
}

type CodeOwner = {
  path: string
  usernames: string[]
}

export const getCodeOwnersInfo = (codeownerContent: string): CodeOwner[] => {
  const lines = codeownerContent.split("\n")
  const ownerEntries = [] as CodeOwner[]

  for (const line of lines) {
    if (!line) {
      continue
    }

    if (line.startsWith("#")) {
      continue
    }

    const [pathString, ...usernames] = line.split(/\s+/)

    ownerEntries.push({
      path: pathString,
      usernames: usernames,
    })
  }

  return ownerEntries
}

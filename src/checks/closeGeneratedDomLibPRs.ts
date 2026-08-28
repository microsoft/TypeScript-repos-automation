import { Octokit } from "@octokit/rest"
import { PullRequestEvent } from "@octokit/webhooks-types"
import type { PRInfo } from "../anyRepoHandlePullRequest.js"
import { addCommentIfMissing } from "../util/addCommentIfMissing.js"
import { Logger } from "../util/logger.js"

export const generatedDomLibFiles = [
  "tsc/internal/bundled/libs/lib.dom.d.ts",
  "tsc/internal/bundled/libs/lib.dom.asynciterable.d.ts",
  "tsc/internal/bundled/libs/lib.dom.iterable.d.ts",
  "tsc/internal/bundled/libs/lib.webworker.d.ts",
  "tsc/internal/bundled/libs/lib.webworker.asynciterable.d.ts",
  "tsc/internal/bundled/libs/lib.webworker.iterable.d.ts",
] as const

const generatedDomLibFileSet: ReadonlySet<string> = new Set(generatedDomLibFiles)

const message = [
  "It looks like you've sent a pull request that updates generated declaration files related to the DOM.",
  "These files aren't meant to be edited by hand; they are generated from",
  "[the TypeScript-DOM-lib-generator repository](https://github.com/microsoft/TypeScript-DOM-lib-generator).",
  "Please make the change in that repository instead.",
  "For housekeeping purposes, this pull request will be closed.",
].join(" ")

export const closeGeneratedDomLibPRs = async (
  api: Octokit,
  payload: PullRequestEvent,
  logger: Logger,
  info: PRInfo,
) => {
  if (payload.pull_request.state === "closed" || info.authorIsMemberOfTSTeam || info.authorIsBot) {
    logger.trace("Skipping generated DOM library check")
    return false
  }

  const { repository: repo, pull_request } = payload
  const files = await api.paginate(api.pulls.listFiles, {
    owner: repo.owner.login,
    repo: repo.name,
    pull_number: pull_request.number,
    per_page: 100,
  })

  if (!files.some(file =>
    generatedDomLibFileSet.has(file.filename)
    || file.previous_filename !== undefined && generatedDomLibFileSet.has(file.previous_filename)
  )) {
    logger.trace("Pull request does not modify generated DOM library files")
    return false
  }

  await addCommentIfMissing(api, info, message)

  await api.pulls.update({
    owner: repo.owner.login,
    repo: repo.name,
    pull_number: pull_request.number,
    state: "closed",
  })
  logger.info("Closed pull request that modifies generated DOM library files")
  return true
}

import { PullRequestEvent } from "@octokit/webhooks-types"
import { Octokit } from "@octokit/rest"
import type { PRInfo } from "../anyRepoHandlePullRequest.js"
import { Logger } from "../util/logger.js"
import { syncMilestoneLabels } from "./syncMilestoneLabels.js"

/**
 * Keep track of the milestone related PRs which are based on linked issues in the PR body
 */
export const addMilestoneLabelsToPRs = async (api: Octokit, payload: PullRequestEvent, logger: Logger, info: PRInfo) => {
  const { repository: repo, pull_request } = payload

  if (pull_request.state === "closed") {
    return logger.info(`Skipping because the pull request is already closed.`)
  }

  await syncMilestoneLabels(
    api,
    repo.owner.login,
    repo.name,
    pull_request.number,
    pull_request.labels.flatMap((label) => label.name ?? []),
    info.relatedIssues
  )
}

import { PullRequestEvent } from "@octokit/webhooks-types"
import { Octokit } from "@octokit/rest"
import type { PRInfo } from "../anyRepoHandlePullRequest.js"
import { Logger } from "../util/logger.js"

/**
 * Label PRs from team members or branches in the same repository.
 */
export const addLabelForTeamMember = async (api: Octokit, payload: PullRequestEvent, logger: Logger, info: PRInfo) => {
  const { repository: repo, pull_request } = payload

  if (!info.isTeamPR) {
    return logger.info("Skipping because the pull request is not from the TS team.")
  }
  if (pull_request.state === "closed") {
    return logger.info(`Skipping because the pull request is already closed.`)
  }

  // Add the label
  await api.issues.addLabels({
    labels: ["Author: Team"],
    repo: repo.name,
    owner: repo.owner.login,
    issue_number: payload.number,
  })
  logger.info("Added labels to PR")
}

import { PullRequestEvent } from "@octokit/webhooks-types"
import { Octokit } from "@octokit/rest"
import type { PRInfo } from "../anyRepoHandlePullRequest.js"
import { Logger } from "../util/logger.js"

/**
 * If the PR comes from a core contributor, set themselves to be the assignee
 * if one isn't set during the creation of the PR.
 */
export const assignSelfToNewPullRequest = async (api: Octokit, payload: PullRequestEvent, logger: Logger, info: PRInfo) => {
  const { repository: repo, pull_request } = payload
  if (pull_request.state === "closed") {
    return logger.info("Skipping because the pull request is already closed")
  }
  if (pull_request.assignees.length > 0) {
    return logger.info("Skipping because there are assignees already")
  }

  const thisIssue = {
    repo: repo.name,
    owner: repo.owner.login,
    id: pull_request.number,
    issue_number: pull_request.number,
  }

  if (info.authorIsMemberOfTSTeam) {
    logger.info(`Adding ${info.effectiveAuthor} as the assignee`)
    await api.issues.addAssignees({ ...thisIssue, assignees: [info.effectiveAuthor] })
  } else {
    logger.info(`Skipping because they are not a TS team member`)
  }
}

import { PullRequestEvent } from "@octokit/webhooks-types"
import { Octokit } from "@octokit/rest"
import type { PRInfo } from "../anyRepoHandlePullRequest.js"
import { Logger } from "../util/logger.js"

/**
 * If a community PR comes in with a 'fixes #43' and 43 is assigned to a team member, then assign that PR
 */
export const assignTeamMemberForRelatedPR = async (api: Octokit, payload: PullRequestEvent, logger: Logger, info: PRInfo) => {
  const { repository: repo, pull_request } = payload
  if (pull_request.state === "closed") {
    return logger.info("Skipping because the pull request is already closed")
  }
  if (pull_request.assignees.length > 0) {
    return logger.info("Skipping because there are assignees already")
  }

  if (info.relatedIssues.length === 0) {
    return logger.info("Skipping because there are no related issues")
  }

  const assignees = new Set<string>()
  for (const issue of info.relatedIssues) {
    for (const issueAssignee of issue.assignees ?? []) {
        assignees.add(issueAssignee.login)
    }
  }

  if (assignees.size) {
    const uniqueAssignees = [...assignees]
    logger.info(`Adding ${uniqueAssignees.join(", ")} as assignees`)
    await api.issues.addAssignees({
      repo: repo.name,
      issue_number: pull_request.number,
      owner: repo.owner.login,
      assignees: uniqueAssignees,
    })
  } 
}

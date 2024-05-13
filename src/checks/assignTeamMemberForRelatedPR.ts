import { WebhookPayloadPullRequest } from "@octokit/webhooks"
import { Octokit } from "@octokit/rest"
import { getRelatedIssues } from "../pr_meta/getRelatedIssues"
import { Logger } from "../util/logger"

/**
 * If a community PR comes in with a 'fixes #43' and 43 is assigned to a team member, then assign that PR
 */
export const assignTeamMemberForRelatedPR = async (api: Octokit, payload: WebhookPayloadPullRequest, logger: Logger) => {
  const { repository: repo, pull_request } = payload
  if (pull_request.assignees.length > 0) {
    return logger.info("Skipping because there are assignees already")
  }

  const relatedIssues = await getRelatedIssues(pull_request.body, repo.owner.login, repo.name, api)
  if (!relatedIssues) {
    return logger.info("Skipping because there are no related issues")
  }

  const assignees: string[] = []
  for (const issue of relatedIssues) {
    for (const issueAssignee of issue.assignees) {
        assignees.push(issueAssignee.login)
    }
  }

  if (assignees.length) {
    logger.info(`Adding ${assignees.join(", ")} as assignees`)
    await api.issues.addAssignees({ repo: repo.name, issue_number: pull_request.number, owner: repo.owner.login, assignees })
  } 
}

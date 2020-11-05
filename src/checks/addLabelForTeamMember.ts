import { WebhookPayloadPullRequest } from "@octokit/webhooks"
import { Octokit } from "@octokit/rest"
import type { Logger } from "@azure/functions"
import type { PRInfo } from "../anyRepoHandlePullRequest"

/**
 * If the PR comes from a core contributor, add a label to indicate it came from a maintainer
 */
export const addLabelForTeamMember = async (api: Octokit, payload: WebhookPayloadPullRequest, logger: Logger, info: PRInfo) => {
  const { repository: repo, pull_request } = payload

  // Check the access level of the user
  if (!info.authorIsMemberOfTSTeam) {
    return logger.info(`Skipping because ${pull_request.user.login} is not a member of the TS team`)
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

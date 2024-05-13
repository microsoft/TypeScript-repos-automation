import { PullRequestEvent } from "@octokit/webhooks-types"
import { Octokit } from "@octokit/rest"
import type { PRInfo } from "../anyRepoHandlePullRequest"
import { Logger } from "../util/logger"

/**
 * If the PR comes from a core contributor, add a label to indicate it came from a maintainer
 */
export const addLabelForTeamMember = async (api: Octokit, payload: PullRequestEvent, logger: Logger, info: PRInfo) => {
  const { repository: repo, pull_request } = payload

  // Check the access level of the user
  if (!info.authorIsMemberOfTSTeam) {
    return logger.info(`Skipping because ${pull_request.user.login} is not a member of the TS team.`)
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

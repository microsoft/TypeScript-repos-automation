import { WebhookPayloadPullRequest } from "@octokit/webhooks"
import { Octokit } from "@octokit/rest"
import { Logger } from "@azure/functions"
import { getRelatedIssues } from "../pr_meta/getRelatedIssues"

/**
 * Keep track of the milestone related PRs which are based on linked issues in the PR body
 */
export const addMilestoneLabelsToPRs = async (api: Octokit, payload: WebhookPayloadPullRequest, logger: Logger) => {
  const { repository: repo, pull_request } = payload

  if (pull_request.state === "closed") {
    return logger.info(`Skipping because the pull request is already closed.`)
  }

  const relatedIssues = await getRelatedIssues(pull_request.body, repo.owner.login, repo.name, api)

  const houseKeepingLabels = {
    "For Milestone Bug": false,
    "For Backlog Bug": false,
    "For Uncommitted Bug": false
  }

  type HouseKeepingKeys = keyof typeof houseKeepingLabels;

  /**
   * For Milestone Bug -- fixes an issue that's in a version milestone, or assigned to a team member
   * For Backlog Bug -- fixes an issue that's in the Backlog milestone.
   * For Uncommitted Bug -- any other PR.
   */
  for (const issue of relatedIssues) {
    const milestone = issue.milestone
    if (milestone) {
      if (milestone.title !== "Backlog" || issue.assignees.length) {
        houseKeepingLabels["For Milestone Bug"] = true
      } else {
        houseKeepingLabels["For Backlog Bug"] = true
      }
    }
  }

  houseKeepingLabels["For Uncommitted Bug"] = !houseKeepingLabels["For Backlog Bug"] && !houseKeepingLabels["For Milestone Bug"]

  // Add / Remove labels

  const thisIssue = {
    repo: repo.name,
    owner: repo.owner.login,
    issue_number: pull_request.number,
  }

  const labelsNeedingToAdd = Object.keys(houseKeepingLabels).filter(l => houseKeepingLabels[l as HouseKeepingKeys])
  const labelsNeedingToRemove = Object.keys(houseKeepingLabels).filter(l => !houseKeepingLabels[l as HouseKeepingKeys]).filter(f => pull_request.labels.find(l => l.name === f))

  for (const toRemove of labelsNeedingToRemove) {
    await api.issues.removeLabel({ ...thisIssue, name: toRemove })
  }

  if (labelsNeedingToAdd.length) {
    await api.issues.addLabels({ ...thisIssue, labels: labelsNeedingToAdd })
  }

  if (houseKeepingLabels["For Milestone Bug"]) {
    for (const issue of relatedIssues) {
      if (!issue.labels.find(l => l.name === "Fix Available")) {
        await api.issues.addLabels({ ...thisIssue, issue_number: issue.number, labels: ["Fix Available"] })
      }
    }
  }
}

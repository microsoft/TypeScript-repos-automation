import {
  WebhookPayloadPullRequest,
  WebhookPayloadIssueComment,
  WebhookPayloadPullRequestReview,
} from "@octokit/webhooks"
import { Octokit } from "@octokit/rest"
import { isMemberOfTSTeam } from "../pr_meta/isMemberOfTSTeam"
import { mergeOrAddMergeLabel } from "../pr_meta/mergeOrAddMergeLabel"
import { Logger } from "../util/logger"

/**
 * If the PR comes from a core contributor, add a label to indicate it came from a maintainer
 */
export const addLabelForTeamMember = async (
  api: Octokit,
  payload: WebhookPayloadIssueComment | WebhookPayloadPullRequestReview,
  logger: Logger
) => {
  const org = payload.repository.owner.login

  let issue: WebhookPayloadIssueComment["issue"] = null!
  let text: string = null!
  let userLogin: string = ""
  let issueNumber: number = -1

  if ("issue" in payload) {
    issue = payload.issue
    text = payload.comment.body
    userLogin = payload.comment.user.login
    issueNumber = issue.number

    // Only look at PR issue comments, this isn't in the type system
    if (!(issue as any).pull_request) {
      return logger.info("Not a Pull Request")
    }
  }

  if ("review" in payload) {
    const repo = payload.repository
    const response = await api.issues.get({
      owner: repo.owner.login,
      repo: repo.name,
      number: payload.pull_request.number,
    })

    issue = response.data as any
    text = payload.review.body as any
    userLogin = payload.review.user.login
  }

  // Bail if there's no text from the review
  if (!text) {
    logger.info("Could not find text for the webhook to look for the merge on green message")
    return
  }

  // Don't do any work unless we have to
  const keywords = ["merge on green"]
  const match = keywords.find(k => text.toLowerCase().includes(k))
  if (!match) {
    return logger.info(`Did not find any of the merging phrases in the comment beginning ${text.substring(0, 12)}.`)
  }

  // Check to see if the label has already been set
  if (issue.labels.find(l => l.name.toLowerCase() === "merge on green")) {
    return logger.info("Already has Merge on Green")
  }

  // Check for org access, so that some rando doesn't
  // try to merge something without permission
  const isTeamMember = await isMemberOfTSTeam(payload.sender.login, api, logger)
  if (!isTeamMember) {
    return logger.info(`Skipping because ${payload.sender.login} is not a member of the TS team`)
  }

  const repo = {
    owner: org,
    repo: payload.repository.name,
    number: issue.number,
  }

  // Need to get the sha for auto-merging
  const prResponse = await api.pulls.get(repo)
  await mergeOrAddMergeLabel(api, repo, prResponse.data.head.sha, logger)

  console.log("Updated the PR with a Merge on Green label")
}

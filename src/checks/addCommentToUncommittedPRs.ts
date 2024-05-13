import { PullRequestEvent } from "@octokit/webhooks-types"
import { Octokit } from "@octokit/rest"
import type { PRInfo } from "../anyRepoHandlePullRequest"
import { Logger } from "../util/logger"

/**
 * Comment on new PRs that don't have linked issues, or link to uncommitted issues.
 */
export const addCommentToUncommittedPRs = async (api: Octokit, payload: PullRequestEvent, logger: Logger, info: PRInfo) => {
  if (payload.pull_request.merged || payload.pull_request.draft || info.authorIsMemberOfTSTeam || info.authorIsTypescriptBot) {
    return logger.trace("Skipping") 
  }


  if (!info.relatedIssues || info.relatedIssues.length === 0) {
    const message = "This PR doesn't have any linked issues. Please open an issue that references this PR. From there we can discuss and prioritise."
    const needsComment = !info.comments || !info.comments.find(c => c.body.startsWith(message.slice(0, 25)))
    if (needsComment) {
      await api.issues.createComment({
        ...info.thisIssue,
        body: message
      })
    }
  }
  else {
    const isSuggestion = info.relatedIssues.some(issue => issue.labels?.find(l => l.name === "Suggestion"))
    const isCommitted = info.relatedIssues.some(issue => issue.labels?.find(l => l.name === "Committed" || l.name === "Experience Enhancement" || l.name === "help wanted"))

    if (isSuggestion && !isCommitted) {
      const message = `The TypeScript team hasn't accepted the linked issue #${info.relatedIssues[0].number}. If you can get it accepted, this PR will have a better chance of being reviewed.`
      const needsComment = !info.comments || !info.comments.find(c => c.body.startsWith(message.slice(0, 25)))
      if (needsComment) {
        await api.issues.createComment({
          ...info.thisIssue,
          body: message
        })
      }
    }
  }
}

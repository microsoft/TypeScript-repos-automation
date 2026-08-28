import { PullRequestEvent } from "@octokit/webhooks-types"
import { Octokit } from "@octokit/rest"
import type { PRInfo } from "../anyRepoHandlePullRequest.js"
import { Logger } from "../util/logger.js"
import { addCommentIfMissing } from "../util/addCommentIfMissing.js"

/**
 * Comment on new PRs that don't have linked issues, or link to uncommitted issues.
 */
export const addCommentToUncommittedPRs = async (api: Octokit, payload: PullRequestEvent, logger: Logger, info: PRInfo) => {
  if (payload.pull_request.state === "closed" || payload.pull_request.draft || info.authorIsMemberOfTSTeam || info.authorIsBot) {
    return logger.trace("Skipping") 
  }


  if (!info.relatedIssues || info.relatedIssues.length === 0) {
    const message = "This PR doesn't have any linked issues. Please open an issue that references this PR. From there we can discuss and prioritise."
    await addCommentIfMissing(api, info, message)
  }
  else {
    const isSuggestion = info.relatedIssues.some(issue => issue.labels?.find(l => {
      const name = typeof l === "string" ? l : l.name;
      return name?.toLowerCase() === "suggestion"
    }))
    const isCommitted = info.relatedIssues.some(issue => issue.labels?.find(l => {
      const name = typeof l === "string" ? l : l.name;
      return name?.toLowerCase() === "committed" || name?.toLowerCase() === "experience enhancement" || name?.toLowerCase() === "help wanted"
    }))

    if (isSuggestion && !isCommitted) {
      const message = `The TypeScript team hasn't accepted the linked issue #${info.relatedIssues[0]?.number}. If you can get it accepted, this PR will have a better chance of being reviewed.`
      await addCommentIfMissing(api, info, message)
    }
  }
}

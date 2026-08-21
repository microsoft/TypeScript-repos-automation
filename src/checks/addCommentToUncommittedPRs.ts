import { PullRequestEvent } from "@octokit/webhooks-types"
import { Octokit } from "@octokit/rest"
import type { PRInfo } from "../anyRepoHandlePullRequest.js"
import { Logger } from "../util/logger.js"

const pendingCommentChecks = new Map<string, Promise<void>>()

const acquireCommentLock = async (key: string) => {
  const previous = pendingCommentChecks.get(key)
  let release!: () => void
  const current = new Promise<void>(resolve => {
    release = resolve
  })
  pendingCommentChecks.set(key, current)

  if (previous) {
    await previous
  }

  return {
    [Symbol.dispose]() {
      release()
      if (pendingCommentChecks.get(key) === current) {
        pendingCommentChecks.delete(key)
      }
    }
  }
}

const addCommentIfMissing = async (api: Octokit, info: PRInfo, message: string) => {
  if (info.comments.some(comment => comment.body?.startsWith(message.slice(0, 25)))) {
    return
  }

  const key = `${info.thisIssue.owner}/${info.thisIssue.repo}#${info.thisIssue.issue_number}`
  using _lock = await acquireCommentLock(key)
  const comments = await api.paginate(api.issues.listComments, info.thisIssue)
  if (!comments.some(comment => comment.body?.startsWith(message.slice(0, 25)))) {
    await api.issues.createComment({
      ...info.thisIssue,
      body: message
    })
  }
}

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

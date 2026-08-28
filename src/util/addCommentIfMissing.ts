import { Octokit } from "@octokit/rest"
import type { PRInfo } from "../anyRepoHandlePullRequest.js"
import { isTypeScriptBot } from "./botUsers.js"

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

export const addCommentIfMissing = async (api: Octokit, info: PRInfo, message: string) => {
  const isMatchingBotComment = (comment: { body?: string | null, user?: { login?: string } | null }) =>
    isTypeScriptBot(comment.user?.login) && comment.body?.startsWith(message.slice(0, 25))

  if (info.comments.some(isMatchingBotComment)) {
    return
  }

  const key = `${info.thisIssue.owner}/${info.thisIssue.repo}#${info.thisIssue.issue_number}`
  using _lock = await acquireCommentLock(key)
  const comments = await api.paginate(api.issues.listComments, info.thisIssue)
  if (!comments.some(isMatchingBotComment)) {
    await api.issues.createComment({
      ...info.thisIssue,
      body: message
    })
  }
}

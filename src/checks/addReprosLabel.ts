import { WebhookPayloadIssueComment, WebhookPayloadIssues } from "@octokit/webhooks"
import { Octokit } from "@octokit/rest"

import { pingDiscord, stripBody } from "./pingDiscordForReproRequests"
import { Logger } from "../util/logger"

const checkForRepro = (toCheck: { body: string }) => {
  const codeblocks = ["```ts repro", "```tsx repro", "```js repro", "```jsx repro"]
  const hasRepro = codeblocks.find(c => toCheck.body.includes(c))
  return hasRepro
}

/**
 * Adds the 'has repro' label to PRs with based on the issue body
 */
export const addReprosLabelOnIssue = async (api: Octokit, payload: WebhookPayloadIssues, logger: Logger) => {
  const actionable = ["opened", "edited"]
  if (!actionable.includes(payload.action)) {
    return logger.info("Skipping because this cannot change repro state")
  }

  if (payload.issue.labels.length === 0) { 
    return logger.info("Skipping because we don't want to add the label until it's been triaged")
  }

  const { repository: repo, issue } = payload
  const hasReproLabel = !!issue.labels.find(l => l.name === "Has Repro")

  const thisIssue = {
    repo: repo.name,
    owner: repo.owner.login,
    issue_number: issue.number,
  }

  const hasReproInBody = checkForRepro(issue)

  if (hasReproInBody && !hasReproLabel) {
    await api.issues.addLabels({ ...thisIssue, labels: ["Has Repro"] })

    await pingDiscord(`Repro created by @${issue.user.login} on #${issue.number}`, {
      number: issue.number,
      title: issue.title,
      body: stripBody(issue.body),
      url: issue.html_url,
    })

    if (issue.labels.find(l => l.name === "Repro Requested")) {
      await api.issues.removeLabel({ ...thisIssue, name: "Repro Requested" })
    }

    // Trigger a run of all repros
    api.repos.createDispatchEvent({ ...thisIssue, event_type: "run-twoslash-repros" })
  }
}

/**
 * Adds the 'has repro' label to PRs with based on a comment
 */
export const addReprosLabelOnComments = async (
  api: Octokit,
  payload: WebhookPayloadIssueComment,
  logger: Logger
) => {
  const actionable = ["created", "edited"]
  if (!actionable.includes(payload.action)) {
    return logger.info("Skipping because this cannot change repro state")
  }

  if (payload.issue.labels.length === 0) { 
    return logger.info("Skipping because we don't want to add the label until it's been triaged")
  }

  const { repository: repo, comment, issue } = payload
  const hasReproLabel = !!issue.labels.find(l => l.name === "Has Repro")

  const thisIssue = {
    repo: repo.name,
    owner: repo.owner.login,
    issue_number: issue.number,
  }

  const hasReproInBody = checkForRepro(comment)

  if (hasReproInBody && !hasReproLabel) {
    await api.issues.addLabels({ ...thisIssue, labels: ["Has Repro"] })

    logger.info("Sending Discord ping")
    await pingDiscord(`Repro created by @${comment.user.login} on #${issue.number}`, {
      number: issue.number,
      title: issue.title,
      body: comment.body,
      url: comment.html_url,
    })

    if (issue.labels.find(l => l.name === "Repro Requested")) {
      await api.issues.removeLabel({ ...thisIssue, name: "Repro Requested" })
    }

    // Trigger a run of all repros
    api.repos.createDispatchEvent({ ...thisIssue, event_type: "run-twoslash-repros" })
  }
}

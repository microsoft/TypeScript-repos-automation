import { Octokit } from "@octokit/rest"
import { PullRequestEvent } from "@octokit/webhooks-types"
import { isCopilot } from "../util/botUsers.js"

type CopilotWorkStartedEvent = {
  event?: string
  created_at?: string | null
  actor?: {
    login?: string
  } | null
  performed_via_github_app?: {
    slug?: string
  } | null
}

const copilotWorkStartedAuthorWindow = 5 * 60 * 1000

export const getPullRequestAuthor = async (api: Octokit, payload: PullRequestEvent) => {
  const author = payload.pull_request.user.login
  if (!isCopilot(author)) return author

  const pullRequestCreatedAt = Date.parse(payload.pull_request.created_at)
  const events: CopilotWorkStartedEvent[] = await api.paginate(api.issues.listEventsForTimeline, {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: payload.pull_request.number,
  })
  return events.find(
    event => {
      const eventCreatedAt = event.created_at === undefined || event.created_at === null
        ? undefined
        : Date.parse(event.created_at)
      return event.event === "copilot_work_started"
        && eventCreatedAt !== undefined
        && eventCreatedAt >= pullRequestCreatedAt
        && eventCreatedAt - pullRequestCreatedAt <= copilotWorkStartedAuthorWindow
        && event.performed_via_github_app?.slug === "copilot-swe-agent"
    }
  )?.actor?.login ?? author
}

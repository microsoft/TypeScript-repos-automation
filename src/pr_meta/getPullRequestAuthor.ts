import { Octokit } from "@octokit/rest"
import { PullRequestEvent } from "@octokit/webhooks-types"
import { isCopilot } from "../util/botUsers.js"

type CopilotWorkStartedEvent = {
  event?: string
  actor?: {
    login?: string
  } | null
}

export const getPullRequestAuthor = async (api: Octokit, payload: PullRequestEvent) => {
  const author = payload.pull_request.user.login
  if (!isCopilot(author)) return author

  const events: CopilotWorkStartedEvent[] = await api.paginate(api.issues.listEventsForTimeline, {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: payload.pull_request.number,
  })
  return events.find(event => event.event === "copilot_work_started")?.actor?.login ?? author
}

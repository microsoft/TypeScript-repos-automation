import { WebhookPayloadPullRequest } from "@octokit/webhooks"
import { Context, Logger } from "@azure/functions"
import { createGitHubClient } from "./util/createGitHubClient"
import { assignSelfToNewPullRequest } from "./checks/assignSelfToNewPullRequest"
import { addLabelForTeamMember } from "./checks/addLabelForTeamMember"
import { assignTeamMemberForRelatedPR } from "./checks/assignTeamMemberForRelatedPR"
import { addMilestoneLabelsToPRs } from "./checks/addMilestoneLabelsToPRs"
import { Octokit } from "@octokit/rest"
import { sha } from "./sha"

export const handlePullRequestPayload = async (payload: WebhookPayloadPullRequest, context: Context) => {
  const api = createGitHubClient()
  const ran = [] as string[]

  const run = (
    name: string,
    fn: (api: Octokit, payload: WebhookPayloadPullRequest, logger: Logger) => Promise<void>
  ) => {
    context.log.info(`\n\n## ${name}\n`)
    ran.push(name)
    return fn(api, payload, context.log)
  }

  if (payload.repository.name === "TypeScript") {
    await run("Assigning Self to Core Team PRs", assignSelfToNewPullRequest)
    await run("Add a core team label to PRs", addLabelForTeamMember)
    await run("Assign core team to PRs which affect their issues", assignTeamMemberForRelatedPR)
    await run("Adding milestone related labels", addMilestoneLabelsToPRs)
  }

  context.res = {
    status: 200,
    headers: { sha: sha },
    body: ran.length ? `PR success, ran: ${ran.join(", ")}`: "Success, NOOP",
  }
}

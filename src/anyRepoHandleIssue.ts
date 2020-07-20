import { WebhookPayloadIssues } from "@octokit/webhooks"
import { Context, Logger } from "@azure/functions"
import { Octokit } from "@octokit/rest"
import { sha } from "./sha"
import { addOrRemoveReprosLabelOnIssue } from "./checks/addOrRemoveReprosLabel"
import { createGitHubClient } from "./util/createGitHubClient"
import { pingDiscordForReproRequests } from "./checks/pingDiscordForReproRequests"

export const handleIssuePayload = async (payload: WebhookPayloadIssues, context: Context) => {
  const api = createGitHubClient()
  const ran = [] as string[]

  const run = (
    name: string,
    fn: (api: Octokit, payload: WebhookPayloadIssues, logger: Logger) => Promise<void>
  ) => {
    context.log.info(`\n\n## ${name}\n`)
    ran.push(name)
    return fn(api, payload, context.log)
  }

  if (payload.repository.name === "TypeScript") {
    run("Adding repro tags from issue bodies", addOrRemoveReprosLabelOnIssue)

    if (payload.action === "labeled") {
      run("Seeing if we should ping discord for the label", pingDiscordForReproRequests)
    } 
  }

  context.res = {
    status: 200,
    headers: { sha: sha },
    body: "Success, but NOOP",
  }
}

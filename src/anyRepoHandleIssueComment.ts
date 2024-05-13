import { WebhookPayloadIssueComment } from "@octokit/webhooks"
import { HttpResponseInit, InvocationContext } from "@azure/functions"
import { createGitHubClient } from "./util/createGitHubClient"
import { Octokit } from "@octokit/rest"
import { sha } from "./sha"
import { mergeThroughCodeOwners } from "./checks/mergeThroughCodeOwners"
import { addReprosLabelOnComments } from "./checks/addReprosLabel"
import { Logger } from "./util/logger"

export const anyRepoHandleIssueCommentPayload = async (payload: WebhookPayloadIssueComment, context: InvocationContext): Promise<HttpResponseInit> => {
  const api = createGitHubClient()
  const ran = [] as string[]

  const run = (
    name: string,
    fn: (api: Octokit, payload: WebhookPayloadIssueComment, logger: Logger) => Promise<void>
  ) => {
    context.info(`\n\n## ${name}\n`)
    ran.push(name)
    return fn(api, payload, context)
  }

  // Making this one whitelisted to the website for now
  if (payload.repository.name === "TypeScript-Website") {
    await run("Checking if we should merge from codeowners", mergeThroughCodeOwners)
  }

  if (payload.repository.name === "TypeScript") {
    await run("Checking if we should add the repros label", addReprosLabelOnComments)
  }

  return {
    status: 200,
    headers: { sha: sha },
    body: `Success, ran: ${ran.join(", ")}`,
  }
}

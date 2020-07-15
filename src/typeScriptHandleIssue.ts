import { WebhookPayloadIssues } from "@octokit/webhooks"
import { Context } from "@azure/functions"
import { sha } from "./sha"

export const handleIssuePayload = async (payload: WebhookPayloadIssues, context: Context) => {
  // NOOP

  context.res = {
    status: 200,
    headers: { sha: sha },
    body: "Success, but NOOP",
  }
}

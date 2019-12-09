import { WebhookPayloadIssues } from "@octokit/webhooks";
import { Context } from "@azure/functions";

export const handleIssuePayload = async (payload: WebhookPayloadIssues, context: Context) => {
  // NOOP

  context.res = {
    status: 200,
    body: "Success"
  };
};

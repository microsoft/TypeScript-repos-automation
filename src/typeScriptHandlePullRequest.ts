import { WebhookPayloadPullRequest } from "@octokit/webhooks";
import { Context } from "@azure/functions";
import { createGitHubClient } from "./util/createGitHubClient";
import { assignSelfToNewPullRequest } from "./checks/assignSelfToNewPullRequest";


export const handlePullRequestPayload = async (payload: WebhookPayloadPullRequest, context: Context) => {
  const api = createGitHubClient();
  // Run checks
  await assignSelfToNewPullRequest(api, payload);

  context.res = {
    status: 200,
    body: "Success"
  };
};

import { app, HttpHandler } from "@azure/functions"
import { verify } from "@octokit/webhooks-methods";
import assert from "assert";

import { handlePullRequestPayload } from "../src/anyRepoHandlePullRequest";
import { anyRepoHandleStatusUpdate } from "../src/anyRepoHandleStatusUpdate";
import { anyRepoHandleIssueCommentPayload } from "../src/anyRepoHandleIssueComment";
import { handleIssuePayload } from "../src/anyRepoHandleIssue";


// The goal of these functions is to validate the call is real, then as quickly as possible get out of the azure
// context and into the `src` directory, where work can be done against tests instead requiring changes to happen
// against a real server.

const httpTrigger: HttpHandler = async function (request, context) {
  const isDev = process.env.AZURE_FUNCTIONS_ENVIRONMENT === "Development"
  // For process.env.GITHUB_WEBHOOK_SECRET see
  // https://ms.portal.azure.com/#@microsoft.onmicrosoft.com/resource/subscriptions/57bfeeed-c34a-4ffd-a06b-ccff27ac91b8/resourceGroups/JSTSTeam-Storage/providers/Microsoft.KeyVault/vaults/jststeam-passwords/secrets
  const secret = process.env.GITHUB_WEBHOOK_SECRET

  const bodyText = await request.text();

  const sig = request.headers.get("x-hub-signature-256");
  if (!isDev && (!sig || !verify(secret!, bodyText, `sha256=${sig}`))) {
    context.log("Invalid signature");
    return {
      status: 500,
      body: "This webhook did not come from GitHub"
    };
  }

  const body = JSON.parse(bodyText);

  // https://github.com/microsoft/TypeScript/settings/hooks/163309719

  const event = request.headers.get("x-github-event") as "pull_request" | "status" | "issue_comment" | "issues";

  switch (event) {
    case "pull_request":
      return handlePullRequestPayload(body, context);

    case "status":
      return anyRepoHandleStatusUpdate(body, context);

    case "issue_comment":
      return anyRepoHandleIssueCommentPayload(body, context)

    case "issues":
      return handleIssuePayload(body, context)

    default:
      context.info("Skipped webhook, do not know how to handle the event: ", event)
      return {};
  }

};

app.http("TypeScriptRepoPullRequestWebhook", { handler: httpTrigger });

export default httpTrigger;

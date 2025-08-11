import { app, HttpHandler } from "@azure/functions"

import { handlePullRequestPayload } from "../src/anyRepoHandlePullRequest";
import { anyRepoHandleIssueCommentPayload } from "../src/anyRepoHandleIssueComment";
import { handleIssuePayload } from "../src/anyRepoHandleIssue";
import { verifyGitHubWebhook } from "../src/util/verifyWebhook";


// The goal of these functions is to validate the call is real, then as quickly as possible get out of the azure
// context and into the `src` directory, where work can be done against tests instead requiring changes to happen
// against a real server.

const httpTrigger: HttpHandler = async function (request, context) {
  const bodyText = await request.text();

  const webbookVerifyResponse = verifyGitHubWebhook(request, context, bodyText);
  if (webbookVerifyResponse) {
    return webbookVerifyResponse;
  }

  const body = JSON.parse(bodyText);

  // https://github.com/microsoft/TypeScript/settings/hooks/163309719

  const event = request.headers.get("x-github-event") as "pull_request" | "status" | "issue_comment" | "issues";

  switch (event) {
    case "pull_request":
      return handlePullRequestPayload(body, context);


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

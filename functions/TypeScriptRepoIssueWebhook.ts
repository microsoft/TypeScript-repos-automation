import { app, HttpHandler } from "@azure/functions"
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

  // NOOP
  return {};
};

app.http("TypeScriptRepoIssueWebhook", { handler: httpTrigger });

import { HttpRequest, InvocationContext } from "@azure/functions";
import { verify } from "@octokit/webhooks-methods";
import assert from "assert";


export function verifyGitHubWebhook(request: HttpRequest, context: InvocationContext, body: string) {
  if (process.env.AZURE_FUNCTIONS_ENVIRONMENT === "Development") {
    return undefined;
  }

const secret = process.env.GITHUB_WEBHOOK_SECRET;
assert(secret, "GITHUB_WEBHOOK_SECRET is not set");

  const sig = request.headers.get("x-hub-signature-256");
  if (!sig || !verify(secret, body, `sha256=${sig}`)) {
    context.log("Invalid signature");
    return {
      status: 500,
      body: "This webhook did not come from GitHub"
    };
  }

  return undefined;
}

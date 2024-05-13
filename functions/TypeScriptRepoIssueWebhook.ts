import { app, HttpHandler } from "@azure/functions"
import { verify } from "@octokit/webhooks-methods";
import assert from "assert";

// The goal of these functions is to validate the call is real, then as quickly as possible get out of the azure
// context and into the `src` directory, where work can be done against tests instead requiring changes to happen
// against a real server.

const httpTrigger: HttpHandler = async function (request, context) {
    const isDev = process.env.AZURE_FUNCTIONS_ENVIRONMENT === "Development"
    // For process.env.GITHUB_WEBHOOK_SECRET see
    // https://ms.portal.azure.com/#@microsoft.onmicrosoft.com/resource/subscriptions/57bfeeed-c34a-4ffd-a06b-ccff27ac91b8/resourceGroups/JSTSTeam-Storage/providers/Microsoft.KeyVault/vaults/jststeam-passwords/secrets
    const secret = process.env.GITHUB_WEBHOOK_SECRET

    const body = await request.text();

    const sig = request.headers.get("x-hub-signature-256");
    if (!isDev && (!sig || !verify(secret!, body, `sha256=${sig}`))) {
        context.log("Invalid signature");
        return {
            status: 500,
            body: "This webhook did not come from GitHub"
        };
    }
    // NOOP
    return {};
};

app.http("TypeScriptRepoIssueWebhook", { handler: httpTrigger });

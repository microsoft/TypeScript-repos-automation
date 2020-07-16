import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import verify = require('@octokit/webhooks/verify')
import sign = require('@octokit/webhooks/sign')

// The goal of these functions is to validate the call is real, then as quickly as possible get out of the azure
// context and into the `src` directory, where work can be done against tests instead requiring changes to happen
// against a real server.

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const isDev = process.env.AZURE_FUNCTIONS_ENVIRONMENT === "Development"
    const secret = process.env.GITHUB_WEBHOOK_SECRET
    // For process.env.GITHUB_WEBHOOK_SECRET see
    // https://ms.portal.azure.com/#@microsoft.onmicrosoft.com/resource/subscriptions/57bfeeed-c34a-4ffd-a06b-ccff27ac91b8/resourceGroups/JSTSTeam-Storage/providers/Microsoft.KeyVault/vaults/jststeam-passwords/secrets
    if (!isDev && !verify(secret, req.body, sign(secret, req.body))) {
        context.res = {
            status: 500,
            body: "This webhook did not come from GitHub"
        };
        return;
    }
    // NOOP
};

export default httpTrigger;

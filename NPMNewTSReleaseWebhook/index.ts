import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { createGitHubClient } from "../src/util/createGitHubClient";

type NPMWebhook = {
    event: string
    name: string
    type: string
    version: string
    change: {
        "dist-tag": string
        version: string
    }
}

const crypto  = require('crypto');
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {

    const expectedSignature = crypto
        .createHmac('sha256', process.env.NPM_HOOK_SECRET)
        .update(req.body)
        .digest('hex');

    if (req.headers["x-npm-signature"] !== `sha256=${expectedSignature}`) {
        throw new Error(`Bad signature received. Rejecting hook. (got ${expectedSignature} expected ${req.headers["x-npm-signature"]}`);
    }

    const webhook = req.body as NPMWebhook
    const tag = webhook.change.version
    const isProd = !tag.includes("-")
    if (isProd) {
        const gh = createGitHubClient()
        const masterRef = await gh.repos.getBranch({ owner: "microsoft", repo: "Make-Monaco-Builds", branch: "master" })
        await gh.git.createTag({ owner: "microsoft", repo: "Make-Monaco-Builds", tag: tag, message: "Auto-generated from TS webhooks", type: "commit", object: masterRef.data.commit.sha })
        context.res = {
            status: 200,
            body: "Tagged"
        }
    } else {
        context.res = {
            status: 200,
            body: "NOOP"
        }
    }
};

export default httpTrigger;

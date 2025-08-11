import { app, HttpHandler } from "@azure/functions"
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
const httpTrigger: HttpHandler = async function (req, _context) {
    const bodyText = await req.text();
    const expectedSignature = crypto
        .createHmac('sha256', process.env.NPM_HOOK_SECRET)
        .update(bodyText)
        .digest('hex');

    if (req.headers.get("x-npm-signature") !== `sha256=${expectedSignature}`) {
        throw new Error(`Bad signature received. Rejecting hook. (got ${expectedSignature} expected ${req.headers.get("x-npm-signature")}`);
    }

    const webhook = JSON.parse(bodyText) as NPMWebhook
    const tag = webhook.change.version
    const isProd = !tag.includes("-dev")
    if (isProd) {
        const gh = createGitHubClient()
        const masterRef = await gh.repos.getBranch({ owner: "microsoft", repo: "Make-Monaco-Builds", branch: "master" })
        await gh.git.createTag({ owner: "microsoft", repo: "Make-Monaco-Builds", tag: tag, message: "Auto-generated from TS webhooks", type: "commit", object: masterRef.data.commit.sha })
        return {
            status: 200,
            body: "Tagged"
        }
    } else {
        return {
            status: 200,
            body: "NOOP"
        }
    }
};

app.http("NPMNewTSReleaseWebhook", { handler: httpTrigger });

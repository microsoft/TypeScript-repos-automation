import { app, HttpHandler } from "@azure/functions"
import crypto from "node:crypto";
import { createGitHubClient } from "../util/createGitHubClient.js";

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

const httpTrigger: HttpHandler = async function (req, _context) {
    const bodyText = await req.text();
    const expectedSignature = crypto
        .createHmac('sha256', process.env.NPM_HOOK_SECRET!)
        .update(bodyText)
        .digest('hex');

    if (req.headers.get("x-npm-signature") !== `sha256=${expectedSignature}`) {
        throw new Error(`Bad signature received. Rejecting hook. (got ${expectedSignature} expected ${req.headers.get("x-npm-signature")}`);
    }

    // NOTE: This webhook has never worked — the repo name was wrong
    // ("Make-Monaco-Builds" instead of "TypeScript-Make-Monaco-Builds")
    // since it was first written, so it always 404'd. Disabled until
    // someone decides whether auto-tagging Make-Monaco-Builds on TS
    // releases is actually desired.
    return { status: 200, body: "NOOP (disabled)" };

    /*
    const webhook = JSON.parse(bodyText) as NPMWebhook
    const tag = webhook.change.version
    const isProd = !tag.includes("-dev")
    if (isProd) {
        const gh = await createGitHubClient("microsoft", "TypeScript-Make-Monaco-Builds")
        const masterRef = await gh.repos.getBranch({ owner: "microsoft", repo: "TypeScript-Make-Monaco-Builds", branch: "master" })
        await gh.git.createTag({ owner: "microsoft", repo: "TypeScript-Make-Monaco-Builds", tag: tag, message: "Auto-generated from TS webhooks", type: "commit", object: masterRef.data.commit.sha })
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
    */
};

app.http("NPMNewTSReleaseWebhook", { handler: httpTrigger });

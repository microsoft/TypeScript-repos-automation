import { WebhookPayloadStatus } from "@octokit/webhooks";
import { Context, Logger } from "@azure/functions";
import { createGitHubClient } from "./util/createGitHubClient";
import Octokit = require("@octokit/rest");
import {sha} from "./sha"
import { mergeOnGreen } from "./checks/mergeOnGreen";


export const anyRepoHandleStatusUpdate = async (payload: WebhookPayloadStatus, context: Context) => {
  const api = createGitHubClient();
  const ran = [] as string[]

  const run = (name: string, fn: (api: Octokit, payload: WebhookPayloadStatus, logger: Logger) => Promise<void>) => {
    context.log.info(`\n\n## ${name}\n`)
    ran.push(name)
    return fn(api, payload, context.log)
  }

    // Run checks
  await run("Checking For Merge on Green", mergeOnGreen)

  context.res = {
    status: 200,
    headers: { sha: sha },
    body: `Success, ran: ${ran.join(", ")}`
  };
};

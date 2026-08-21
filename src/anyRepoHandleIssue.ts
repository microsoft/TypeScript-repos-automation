import { IssuesEvent } from "@octokit/webhooks-types"
import { InvocationContext, HttpResponseInit } from "@azure/functions"
import { Octokit } from "@octokit/rest"
import { sha } from "./sha.js"
import { addMilestoneLabelsToRelatedPRs } from "./checks/addMilestoneLabelsToRelatedPRs.js";
import { createGitHubClient } from "./util/createGitHubClient.js"
import { Logger } from "./util/logger.js"
import { isTypeScriptRepo } from "./util/isTypeScriptRepo.js"

export const handleIssuePayload = async (payload: IssuesEvent, context: InvocationContext): Promise<HttpResponseInit> => {
  if (!isTypeScriptRepo(payload.repository.owner.login, payload.repository.name)) {
    return {
      status: 200,
      headers: { sha },
      body: "Success, NOOP",
    }
  }

  const api = await createGitHubClient(payload.repository.owner.login, payload.repository.name)
  const ran = [] as string[]

  const run = (
    name: string,
    fn: (api: Octokit, payload: IssuesEvent, logger: Logger) => Promise<void>
  ) => {
    context.info(`\n\n## ${name}\n`)
    ran.push(name)
    return fn(api, payload, context)
  }
  await run("Adding milestone labels to related PRs", addMilestoneLabelsToRelatedPRs)

  return {
    status: 200,
    headers: { sha: sha },
    body: ran.length ? `Issue success, ran: ${ran.join(", ")}`: "Success, NOOP",
  }
}

import { IssuesEvent } from "@octokit/webhooks-types"
import { InvocationContext, HttpResponseInit } from "@azure/functions"
import { Octokit } from "@octokit/rest"
import { sha } from "./sha"
import { addReprosLabelOnIssue } from "./checks/addReprosLabel"
import { addMilestoneLabelsToRelatedPRs } from "./checks/addMilestoneLabelsToRelatedPRs";
import { createGitHubClient } from "./util/createGitHubClient"
import { Logger } from "./util/logger"

export const handleIssuePayload = async (payload: IssuesEvent, context: InvocationContext): Promise<HttpResponseInit> => {
  const api = createGitHubClient()
  const ran = [] as string[]

  const run = (
    name: string,
    fn: (api: Octokit, payload: IssuesEvent, logger: Logger) => Promise<void>
  ) => {
    context.info(`\n\n## ${name}\n`)
    ran.push(name)
    return fn(api, payload, context)
  }

  if (payload.repository.name === "TypeScript") {
    await run("Adding repro tags from issue bodies", addReprosLabelOnIssue)
    await run("Adding milestone labels to related PRs", addMilestoneLabelsToRelatedPRs)
  }

  return {
    status: 200,
    headers: { sha: sha },
    body: ran.length ? `Issue success, ran: ${ran.join(", ")}`: "Success, NOOP",
  }
}

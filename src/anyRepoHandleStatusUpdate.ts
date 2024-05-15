import { StatusEvent } from "@octokit/webhooks-types"
import { createGitHubClient } from "./util/createGitHubClient"
import { Octokit } from "@octokit/rest"
import { sha } from "./sha"
import { HttpResponseInit, InvocationContext } from "@azure/functions"
import { Logger } from "./util/logger"

export const anyRepoHandleStatusUpdate = async (payload: StatusEvent, context: InvocationContext): Promise<HttpResponseInit> => {
  const api = createGitHubClient()
  const ran = [] as string[]

  const run = (name: string, fn: (api: Octokit, payload: StatusEvent, logger: Logger) => Promise<void>) => {
    context.info(`\n\n## ${name}\n`)
    ran.push(name)
    return fn(api, payload, context)
  }

  return {
    status: 200,
    headers: { sha: sha },
    body: `Success, ran: ${ran.join(", ")}`,
  }
}

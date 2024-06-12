import { PullRequestEvent } from "@octokit/webhooks-types"
import { createGitHubClient } from "./util/createGitHubClient"
import { assignSelfToNewPullRequest } from "./checks/assignSelfToNewPullRequest"
import { addLabelForTeamMember } from "./checks/addLabelForTeamMember"
import { assignTeamMemberForRelatedPR } from "./checks/assignTeamMemberForRelatedPR"
import { addMilestoneLabelsToPRs } from "./checks/addMilestoneLabelsToPRs"
import { addCommentToUncommittedPRs } from "./checks/addCommentToUncommittedPRs"
import { Octokit, RestEndpointMethodTypes } from "@octokit/rest"
import { sha } from "./sha"
import { isMemberOfTSTeam } from "./pr_meta/isMemberOfTSTeam"
import { getRelatedIssues } from "./pr_meta/getRelatedIssues"
import { HttpResponseInit, InvocationContext } from "@azure/functions"
import { Logger } from "./util/logger"

export const handlePullRequestPayload = async (payload: PullRequestEvent, context: InvocationContext): Promise<HttpResponseInit> => {
  const api = createGitHubClient()
  const ran = [] as string[]

  const run = (
    name: string,
    fn: (api: Octokit, payload: PullRequestEvent, logger: Logger, pr: PRInfo) => Promise<void>,
    pr: PRInfo
  ) => {
    context.info(`\n\n## ${name}\n`)
    ran.push(name)
    return fn(api, payload, context, pr)
  }

  if (payload.repository.name === "TypeScript") {
    const pr = await generatePRInfo(api, payload, context)

    await run("Assigning Self to Core Team PRs", assignSelfToNewPullRequest, pr)
    await run("Add a core team label to PRs", addLabelForTeamMember, pr)
    await run("Assign core team to PRs which affect their issues", assignTeamMemberForRelatedPR, pr)
    await run("Adding milestone related labels", addMilestoneLabelsToPRs, pr)
    await run("Adding comment on uncommitted PRs", addCommentToUncommittedPRs, pr)
  }

  return {
    status: 200,
    headers: { sha: sha },
    body: ran.length ? `PR success, ran: ${ran.join(", ")}`: "Success, NOOP",
  }
}

// The return type of generatePRInfo
export type PRInfo = Awaited<ReturnType<typeof generatePRInfo>>

const generatePRInfo = async (api: Octokit, payload: PullRequestEvent, logger: Logger) => {
  const { repository: repo, pull_request } = payload

  const thisIssue = {
    repo: repo.name,
    owner: repo.owner.login,
    issue_number: pull_request.number,
  }
  
  const options = api.issues.listComments.endpoint.merge(thisIssue)
  const comments: RestEndpointMethodTypes["issues"]["listComments"]["response"]["data"] = await api.paginate(options)

  const authorIsMemberOfTSTeam = await isMemberOfTSTeam(payload.pull_request.user.login, api, logger)
  const relatedIssues = await getRelatedIssues(pull_request.body ?? "", repo.owner.login, repo.name, api)

  return {
    thisIssue,
    authorIsMemberOfTSTeam,
    authorIsBot: payload.pull_request.user.login === "typescript-bot" || payload.pull_request.user.type === "Bot",
    relatedIssues,
    comments 
  }
}

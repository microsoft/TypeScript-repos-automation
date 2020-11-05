import { WebhookPayloadPullRequest } from "@octokit/webhooks"
import { Context, Logger } from "@azure/functions"
import { createGitHubClient } from "./util/createGitHubClient"
import { assignSelfToNewPullRequest } from "./checks/assignSelfToNewPullRequest"
import { addLabelForTeamMember } from "./checks/addLabelForTeamMember"
import { assignTeamMemberForRelatedPR } from "./checks/assignTeamMemberForRelatedPR"
import { addMilestoneLabelsToPRs } from "./checks/addMilestoneLabelsToPRs"
import { addCommentToUncommittedPRs } from "./checks/addCommentToUncommittedPRs"
import { Octokit } from "@octokit/rest"
import { sha } from "./sha"
import { isMemberOfTSTeam } from "./pr_meta/isMemberOfTSTeam"
import { getRelatedIssues } from "./pr_meta/getRelatedIssues"

export const handlePullRequestPayload = async (payload: WebhookPayloadPullRequest, context: Context) => {
  const api = createGitHubClient()
  const ran = [] as string[]

  const run = (
    name: string,
    fn: (api: Octokit, payload: WebhookPayloadPullRequest, logger: Logger, pr: PRInfo) => Promise<void>,
    pr: PRInfo
  ) => {
    context.log.info(`\n\n## ${name}\n`)
    ran.push(name)
    return fn(api, payload, context.log, pr)
  }

  if (payload.repository.name === "TypeScript") {
    const pr = await generatePRInfo(api, payload, context.log)

    await run("Assigning Self to Core Team PRs", assignSelfToNewPullRequest, pr)
    await run("Add a core team label to PRs", addLabelForTeamMember, pr)
    await run("Assign core team to PRs which affect their issues", assignTeamMemberForRelatedPR, pr)
    await run("Adding milestone related labels", addMilestoneLabelsToPRs, pr)
    await run("Adding comment on uncommitted PRs", addCommentToUncommittedPRs, pr)
  }

  context.res = {
    status: 200,
    headers: { sha: sha },
    body: ran.length ? `PR success, ran: ${ran.join(", ")}`: "Success, NOOP",
  }
}

export type UnPromise<T> = T extends Promise<infer U> ? U : T
// The return type of generatePRInfo
export type PRInfo = UnPromise<ReturnType<typeof generatePRInfo>>

const generatePRInfo = async (api: Octokit, payload: WebhookPayloadPullRequest, logger: Logger) => {
  const { repository: repo, pull_request } = payload

  const thisIssue = {
    repo: repo.name,
    owner: repo.owner.login,
    issue_number: pull_request.number,
  }
  
  const options = api.issues.listComments.endpoint.merge(thisIssue)
  const comments: Octokit.IssuesListCommentsResponse = await api.paginate(options)

  const authorIsMemberOfTSTeam = await isMemberOfTSTeam(payload.sender.login, api, logger)
  const relatedIssues = await getRelatedIssues(pull_request.body, repo.owner.login, repo.name, api)

  return {
    thisIssue,
    authorIsMemberOfTSTeam,
    relatedIssues,
    comments 
  }
}

import { PullRequestEvent } from "@octokit/webhooks-types"
import { createGitHubClient } from "./util/createGitHubClient.js"
import { assignSelfToNewPullRequest } from "./checks/assignSelfToNewPullRequest.js"
import { addLabelForTeamMember } from "./checks/addLabelForTeamMember.js"
import { assignTeamMemberForRelatedPR } from "./checks/assignTeamMemberForRelatedPR.js"
import { addMilestoneLabelsToPRs } from "./checks/addMilestoneLabelsToPRs.js"
import { addCommentToUncommittedPRs } from "./checks/addCommentToUncommittedPRs.js"
import { Octokit, RestEndpointMethodTypes } from "@octokit/rest"
import { sha } from "./sha.js"
import { isMemberOfTSTeam } from "./pr_meta/isMemberOfTSTeam.js"
import { getRelatedIssues } from "./pr_meta/getRelatedIssues.js"
import { HttpResponseInit, InvocationContext } from "@azure/functions"
import { Logger } from "./util/logger.js"
import { isTypeScriptBot } from "./util/botUsers.js"
import { isTypeScriptRepo } from "./util/isTypeScriptRepo.js"
import { closeGeneratedDomLibPRs } from "./checks/closeGeneratedDomLibPRs.js"
import { getPullRequestAuthor } from "./pr_meta/getPullRequestAuthor.js"

export const handlePullRequestPayload = async (payload: PullRequestEvent, context: InvocationContext): Promise<HttpResponseInit> => {
  if (
    !isTypeScriptRepo(payload.repository.owner.login, payload.repository.name)
    || payload.pull_request.state === "closed"
  ) {
    return {
      status: 200,
      headers: { sha },
      body: "Success, NOOP",
    }
  }

  const api = await createGitHubClient(payload.repository.owner.login, payload.repository.name)
  const ran = [] as string[]

  const run = <T>(
    name: string,
    fn: (api: Octokit, payload: PullRequestEvent, logger: Logger, pr: PRInfo) => Promise<T>,
    pr: PRInfo
  ) => {
    context.info(`\n\n## ${name}\n`)
    ran.push(name)
    return fn(api, payload, context, pr)
  }

  const pr = await generatePRInfo(api, payload, context)

  if (await run("Closing external PRs that modify generated DOM libraries", closeGeneratedDomLibPRs, pr)) {
    return {
      status: 200,
      headers: { sha },
      body: `PR success, ran: ${ran.join(", ")}`,
    }
  }

  await run("Assigning Self to Core Team PRs", assignSelfToNewPullRequest, pr)
  await run("Add a core team label to PRs", addLabelForTeamMember, pr)
  await run("Assign core team to PRs which affect their issues", assignTeamMemberForRelatedPR, pr)
  await run("Adding milestone related labels", addMilestoneLabelsToPRs, pr)
  await run("Adding comment on uncommitted PRs", addCommentToUncommittedPRs, pr)

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

  const effectiveAuthor = await getPullRequestAuthor(api, payload)
  const authorIsMemberOfTSTeam = await isMemberOfTSTeam(effectiveAuthor, api, logger)
  const relatedIssues = await getRelatedIssues(repo.owner.login, repo.name, pull_request.number, api)

  return {
    thisIssue,
    effectiveAuthor,
    authorIsMemberOfTSTeam,
    authorIsBot: isTypeScriptBot(payload.pull_request.user.login)
      || payload.pull_request.user.login === "csigs"
      || payload.pull_request.user.type === "Bot",
    relatedIssues,
    comments 
  }
}

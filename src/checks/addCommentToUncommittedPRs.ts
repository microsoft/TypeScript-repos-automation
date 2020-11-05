import { WebhookPayloadPullRequest } from "@octokit/webhooks"
import { Octokit } from "@octokit/rest"
import { Logger } from "@azure/functions"
import { getRelatedIssues } from "../pr_meta/getRelatedIssues"
import { isMemberOfTSTeam } from "../pr_meta/isMemberOfTSTeam"

/**
 * Comment on new PRs that don't have linked issues, or link to uncommitted issues.
 */
export const addCommentToUncommittedPRs = async (api: Octokit, payload: WebhookPayloadPullRequest, logger: Logger) => {
  const { repository: repo, pull_request } = payload
  if (pull_request.merged) {
    return
  }

  const relatedIssues = await getRelatedIssues(pull_request.body, repo.owner.login, repo.name, api)

  const thisIssue = {
    repo: repo.name,
    owner: repo.owner.login,
    issue_number: pull_request.number,
  }
  if (!relatedIssues || relatedIssues.length === 0) {
    const comments = (await api.issues.listComments(thisIssue)).data
    if (!comments || !comments.find(c => c.body.startsWith('The PR doesn'))) {
      await api.issues.createComment({
        ...thisIssue,
        body: "This PR doesn't have any linked issues. Please open an issue that references this PR. From there we can discuss and prioritise."
      })
    }
  }
  else {
    const isSuggestion = relatedIssues.some(issue => issue.labels?.find(l => l.name === "Suggestion"))
    const isCommitted = relatedIssues.some(issue => issue.labels?.find(l => l.name === "Committed" || l.name === "Experience Enhancement" || l.name === "help wanted"))
    if (isSuggestion && !isCommitted && !(await isMemberOfTSTeam(pull_request.user.login, api, logger))) {
      const comments = (await api.issues.listComments(thisIssue)).data
      if (!comments || !comments.find(c => c.body.startsWith('The TypeScript team has'))) {
        await api.issues.createComment({
          ...thisIssue,
          body: `The TypeScript team hasn't accepted the linked issue #${relatedIssues[0].number}. If you can get it accepted, this PR will have a better chance of being reviewed.`
        })
      }
    }
  }
}

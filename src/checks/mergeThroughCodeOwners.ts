import { IssueCommentEvent } from "@octokit/webhooks-types"
import { Octokit } from "@octokit/rest"
import { hasAccessToMergePRs } from "../pr_meta/hasAccessToMergePR"
import { mergeOrAddMergeLabel } from "../pr_meta/mergeOrAddMergeLabel"
import { Logger } from "../util/logger"

export const mergePhrase = "ready to merge"

/**
 * Allow someone to declare a PR should be merged if they have access rights via code owners
 */
export const mergeThroughCodeOwners = async (api: Octokit, payload: IssueCommentEvent, logger: Logger) => {
  if (!payload.comment.body.toLowerCase().includes(mergePhrase)) {
    return logger.info(`Issue comment did not include '${mergePhrase}', skipping merge through code owners checks`)
  }

  // Grab the correlating PR
  let pull: Octokit.Response<Octokit.PullsGetResponse>["data"]

  try {
    const response = await api.pulls.get({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      pull_number: payload.issue.number,
    })
    pull = response.data
  } catch (error) {
    return logger.info(`Comment was in an issue`)
  }

  const canMerge = await hasAccessToMergePRs(payload.comment.user.login, api, pull, logger)
  if (!canMerge) {
    return // it logs in the function above
  }

  logger.info("Looks good to merge")
  await mergeOrAddMergeLabel(
    api,
    { number: pull.number, repo: pull.base.repo.name, owner: pull.base.repo.owner.login },
    pull.head.sha,
    logger
  )
}

import { WebhookPayloadStatus } from "@octokit/webhooks"
import { Octokit } from "@octokit/rest"
import { Logger } from "@azure/functions"

/**
 * If the PR comes from a core contributor, set themselves to be the assignee
 * if one isn't set during the creation of the PR.
 */
export const mergeOnGreen = async (api: Octokit, payload: WebhookPayloadStatus, logger: Logger) => {
  if (payload.state !== "success") {
    return logger.info(`Not a successful state - got ${payload.state}`)
  }

  // Check to see if all other statuses on the same commit are also green. E.g. is this the last green.
  const owner = payload.repository.owner.login
  const repo = payload.repository.name
  const allGreen = await api.repos.getCombinedStatusForRef({ owner, repo, ref: payload.commit.sha })

  if (allGreen.data.state !== "success") {
    return logger.info("Not all statuses are green")
  }

  // See https://github.com/maintainers/early-access-feedback/issues/114 for more context on getting a PR from a SHA
  const repoString = payload.repository.full_name
  const searchResponse = await api.search.issues({ q: `${payload.commit.sha} type:pr is:open repo:${repoString}` })

  // https://developer.github.com/v3/search/#search-issues
  const prsWithCommit = searchResponse.data.items.map((i: any) => i.number) as number[]
  for (const number of prsWithCommit) {
    // Get the PR labels
    const issue = await api.issues.get({ owner, repo, number })

    // Get the PR combined status
    const mergeLabel = issue.data.labels.find(l => l.name.toLowerCase() === "merge on green")
    if (!mergeLabel) {
      return logger.info(`PR ${number} does not have Merge on Green`)
    } else {
      logger.info(`Merging PR ${number} via Merge on Green`)
    }

    let commitTitle = `Merge pull request #${number} by microsoft/typescript-repos-automation`

    if (issue.data.title) {
      // Strip any "@user =>" prefixes from the pr title
      const prTitle = issue.data.title.replace(/@(\w|-)+\s+=>\s+/, "")
      commitTitle = `${prTitle} (#${number})`
    }

    // Merge the PR
    await api.pulls.merge({ owner, repo, number, commit_title: commitTitle })
    logger.info(`Merged Pull Request ${number}`)
  }
}

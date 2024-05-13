import { Octokit } from "@octokit/rest"
import { Logger } from "../util/logger"

type PullMeta = {
  repo: string
  owner: string
  number: number
}

export const mergeOrAddMergeLabel = async (api: Octokit, pullMeta: PullMeta, headCommitSHA: string, logger: Logger) => {
  const allGreen = await api.repos.getCombinedStatusForRef({ ...pullMeta, ref: headCommitSHA })

  if (allGreen.data.state === "success") {
    logger.trace("Merging")
    // Merge now
    const commitTitle = "Merged automatically"
    await api.pulls.merge({ ...pullMeta, commit_title: commitTitle })
  } else {
    logger.trace("Adding Merge on Green")
    // Merge when green
    await api.issues.addLabels({ ...pullMeta, labels: ["Merge on Green"] })
  }
}

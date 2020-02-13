import * as Octokit from "@octokit/rest";
import { Logger } from "@azure/functions";

type PullMeta = {
  repo: string,
  owner: string,
  number: number
}

export const mergeOrAddMergeLabel = async (api: Octokit, pullMeta: PullMeta, headCommitSHA: string, logger: Logger) => {
  const allGreen = await api.repos.getCombinedStatusForRef({ ...pullMeta, ref: headCommitSHA })
  
  if (allGreen.data.state === "success") {
    logger("Merging")
    // Merge now
    const commitTitle = "Merged automatically"
    await api.pulls.merge({ ...pullMeta, commit_title: commitTitle })
  } else {
    logger("Adding Merge on Green")
    // Merge when green
    await api.issues.addLabels({ ...pullMeta, labels: ["Merge on Green"] })
  }
}

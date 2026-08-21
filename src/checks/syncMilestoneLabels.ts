import { Octokit } from "@octokit/rest"

const milestoneLabels = [
  "For Milestone Bug",
  "For Backlog Bug",
  "For Uncommitted Bug",
] as const

interface RelatedIssue {
  milestone: { title: string } | null
  assignees?: readonly unknown[] | null
}

export const getMilestoneLabels = (issues: readonly RelatedIssue[]) => {
  let hasMilestoneBug = false
  let hasBacklogBug = false

  for (const issue of issues) {
    if (!issue.milestone) {
      continue
    }
    if (issue.milestone.title !== "Backlog" || issue.assignees?.length) {
      hasMilestoneBug = true
    } else {
      hasBacklogBug = true
    }
  }

  const labels: string[] = []
  if (hasMilestoneBug) labels.push("For Milestone Bug")
  if (hasBacklogBug) labels.push("For Backlog Bug")
  if (!labels.length) labels.push("For Uncommitted Bug")
  return labels
}

export const syncMilestoneLabels = async (
  api: Octokit,
  owner: string,
  repo: string,
  pullRequest: number,
  currentLabels: readonly string[],
  relatedIssues: readonly RelatedIssue[]
) => {
  const desiredLabels = getMilestoneLabels(relatedIssues)
  const labelsToRemove = milestoneLabels.filter(
    (label) => currentLabels.includes(label) && !desiredLabels.includes(label)
  )
  const labelsToAdd = desiredLabels.filter((label) => !currentLabels.includes(label))

  for (const label of labelsToRemove) {
    await api.issues.removeLabel({
      owner,
      repo,
      issue_number: pullRequest,
      name: label,
    })
  }

  if (labelsToAdd.length) {
    await api.issues.addLabels({
      owner,
      repo,
      issue_number: pullRequest,
      labels: labelsToAdd,
    })
  }
}

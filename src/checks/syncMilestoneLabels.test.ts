import { describe, expect, it } from "vitest"
import { getMilestoneLabels, syncMilestoneLabels } from "./syncMilestoneLabels.js"
import { createMockGitHubClient } from "../util/tests/createMockGitHubClient.js"

describe(getMilestoneLabels, () => {
  it("preserves every classification represented by closing issues", () => {
    expect(getMilestoneLabels([
      { milestone: { title: "TypeScript 7.1" }, assignees: [] },
      { milestone: { title: "Backlog" }, assignees: [] },
    ])).toEqual(["For Milestone Bug", "For Backlog Bug"])
  })

  it("classifies PRs without a milestoned closing issue as uncommitted", () => {
    expect(getMilestoneLabels([{ milestone: null, assignees: [] }])).toEqual([
      "For Uncommitted Bug",
    ])
  })
})

describe(syncMilestoneLabels, () => {
  it("only removes stale labels and adds missing labels", async () => {
    const { mockAPI, api } = createMockGitHubClient()

    await syncMilestoneLabels(
      api,
      "microsoft",
      "TypeScript",
      123,
      ["For Milestone Bug", "For Uncommitted Bug"],
      [
        { milestone: { title: "TypeScript 7.1" }, assignees: [] },
        { milestone: { title: "Backlog" }, assignees: [] },
      ]
    )

    expect(mockAPI.issues.removeLabel).toHaveBeenCalledWith({
      owner: "microsoft",
      repo: "TypeScript",
      issue_number: 123,
      name: "For Uncommitted Bug",
    })
    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      owner: "microsoft",
      repo: "TypeScript",
      issue_number: 123,
      labels: ["For Backlog Bug"],
    })
  })
})

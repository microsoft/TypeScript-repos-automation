import { describe, it, expect } from "vitest"

import { addMilestoneLabelsToPRs } from "./addMilestoneLabelsToPRs.js"
import { createMockGitHubClient, getPRFixture } from "../util/tests/createMockGitHubClient.js"
import { getFakeLogger } from "../util/tests/createMockContext.js"
import { createPRInfo } from "../util/tests/createPRInfo.js"
import { Label } from "@octokit/webhooks-types"

describe(addMilestoneLabelsToPRs, () => {
  it("Keeps existing labels from the PR", async () => {
    const { mockAPI, api } = createMockGitHubClient()

    const pr = getPRFixture("opened")
    pr.pull_request.labels = [{ name: "Something" } as Partial<Label> as Label, { name: "Other" } as Partial<Label> as Label]

    await addMilestoneLabelsToPRs(api, pr, getFakeLogger(), createPRInfo({
      relatedIssues: [{ assignees: [] }] as any,
    }))

    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
      labels: ["For Uncommitted Bug"],
    })
    expect(mockAPI.issues.removeLabel).not.toHaveBeenCalled()
  })

  it("Makes the PR Uncommitted", async () => {
    const { mockAPI, api } = createMockGitHubClient()

    const pr = getPRFixture("opened")
    pr.pull_request.body = `fixes #1123`

    await addMilestoneLabelsToPRs(api, pr, getFakeLogger(), createPRInfo({
      relatedIssues: [{ assignees: [] }] as any,
    }))

    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
      labels: ["For Uncommitted Bug"],
    })
  })

  it("Removes a label if milestone doesn't match the current labels", async () => {
    const { mockAPI, api } = createMockGitHubClient()

    const pr = getPRFixture("opened")
    pr.pull_request.body = `fixes #1123`
    pr.pull_request.labels = [{ name: "For Backlog Bug" } as Partial<Label> as Label]

    await addMilestoneLabelsToPRs(api, pr, getFakeLogger(), createPRInfo({
      relatedIssues: [{ number: 1111, assignees: [], milestone: { title: "Not Backlog" }, labels: [] }] as any,
    }))

    expect(mockAPI.issues.removeLabel).toHaveBeenCalledWith({
      issue_number: 35454,
      name: "For Backlog Bug",
      owner: "microsoft",
      repo: "TypeScript",
    })

    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
      labels: ["For Milestone Bug"],
    })

    expect(mockAPI.issues.addLabels).toHaveBeenCalledTimes(1)
  })

  it("Doesn't do anything for closed PRs", async () => {
    const { mockAPI, api } = createMockGitHubClient()

    const pr = getPRFixture("closed")
    pr.pull_request.body = `fixes #1123`

    await addMilestoneLabelsToPRs(api, pr, getFakeLogger(), createPRInfo())

    expect(mockAPI.issues.addLabels).not.toHaveBeenCalled()
  })
})

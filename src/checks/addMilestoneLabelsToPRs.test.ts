jest.mock("../pr_meta/getRelatedIssues")

import { addMilestoneLabelsToPRs } from "./addMilestoneLabelsToPRs"
import { createMockGitHubClient, getPRFixture } from "../util/tests/createMockGitHubClient"
import { getFakeLogger } from "../util/tests/createMockContext"

import { getRelatedIssues } from "../pr_meta/getRelatedIssues"
import { Label } from "@octokit/webhooks-types"
const mockGetRelatedIssues = (getRelatedIssues as any) as jest.Mock

describe(addMilestoneLabelsToPRs, () => {
  it("Keeps existing labels from the PR", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockGetRelatedIssues.mockResolvedValue([{ assignees: [] }])

    const pr = getPRFixture("opened")
    pr.pull_request.labels = [{ name: "Something" } as Partial<Label> as Label, { name: "Other" } as Partial<Label> as Label]

    await addMilestoneLabelsToPRs(api, pr, getFakeLogger())

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
    mockGetRelatedIssues.mockResolvedValue([{ assignees: [] }])

    const pr = getPRFixture("opened")
    pr.pull_request.body = `fixes #1123`

    await addMilestoneLabelsToPRs(api, pr, getFakeLogger())

    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
      labels: ["For Uncommitted Bug"],
    })
  })

  it("Removes a label if milestone doesn't match the current labels", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockGetRelatedIssues.mockResolvedValue([{ number: 1111, assignees: [], milestone: { title: "Not Backlog" }, labels: [] }])

    const pr = getPRFixture("opened")
    pr.pull_request.body = `fixes #1123`
    pr.pull_request.labels = [{ name: "For Backlog Bug" } as Partial<Label> as Label]

    await addMilestoneLabelsToPRs(api, pr, getFakeLogger())

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

    // Verifies that it adds the 'fix available' label
    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      issue_number: 1111,
      owner: "microsoft",
      repo: "TypeScript",
      labels: ["Fix Available"],
    })
  })

  it("Removes a label if milestone doesn't match the current labels", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockGetRelatedIssues.mockResolvedValue([{ assignees: [], milestone: { title: "Not Backlog" }, labels: [{ name: "Fix Available"}] }])

    const pr = getPRFixture("opened")
    pr.pull_request.body = `fixes #1123`
    pr.pull_request.labels = [{ name: "For Backlog Bug" } as Partial<Label> as Label]

    await addMilestoneLabelsToPRs(api, pr, getFakeLogger())

    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
      labels: ["For Milestone Bug"],
    })
  })
  it("Doesn't do anything for closed PRs", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockGetRelatedIssues.mockResolvedValue([{ assignees: [] }])

    const pr = getPRFixture("closed")
    pr.pull_request.body = `fixes #1123`

    await addMilestoneLabelsToPRs(api, pr, getFakeLogger())

    expect(mockAPI.issues.addLabels).not.toHaveBeenCalled()
  })
})

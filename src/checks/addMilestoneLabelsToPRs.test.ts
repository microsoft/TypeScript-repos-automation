jest.mock("../pr_meta/getRelatedIssues")

import { addMilestoneLabelsToPRs } from "./addMilestoneLabelsToPRs"
import { createMockGitHubClient, getPRFixture } from "../util/tests/createMockGitHubClient"
import { getFakeLogger } from "../util/tests/createMockContext"

import { getRelatedIssues } from "../pr_meta/getRelatedIssues"
const mockGetRelatedIssues = (getRelatedIssues as any) as jest.Mock

describe(addMilestoneLabelsToPRs, () => {

  it("Keeps existing labels from the PR", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockGetRelatedIssues.mockResolvedValue([{ assignees: [] }])

    const pr = getPRFixture("opened")
    pr.pull_request.labels = [{name: "Something"}, {name: "Other"}]

    await addMilestoneLabelsToPRs(api, pr, getFakeLogger())

    expect(mockAPI.issues.replaceLabels).toHaveBeenCalledWith({
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
      labels: ["Something", "Other", "For Uncommitted Bug"]
    })
  })

  it("Makes the PR Uncommitted", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockGetRelatedIssues.mockResolvedValue([
      { assignees: [] }
    ])

    const pr = getPRFixture("opened")
    pr.pull_request.body = `fixes #1123`

    await addMilestoneLabelsToPRs(api, pr, getFakeLogger())

    expect(mockAPI.issues.replaceLabels).toHaveBeenCalledWith({
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
      labels: ["For Uncommitted Bug"]
    })
  })

  it("Removes a label if milestone doesn't match the current labels", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockGetRelatedIssues.mockResolvedValue([
      { assignees: [], milestone: { title: "Not Backlog" } }
    ])

    const pr = getPRFixture("opened")
    pr.pull_request.body = `fixes #1123`
    pr.pull_request.labels = [{name: "For Backlog Bug"}]

    await addMilestoneLabelsToPRs(api, pr, getFakeLogger())

    expect(mockAPI.issues.replaceLabels).toHaveBeenCalledWith({
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
      labels: ["For Milestone Bug"]
    })
  })

  it("Removes a label if milestone doesn't match the current labels", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockGetRelatedIssues.mockResolvedValue([
      { assignees: [], milestone: { title: "Not Backlog" } }
    ])

    const pr = getPRFixture("opened")
    pr.pull_request.body = `fixes #1123`
    pr.pull_request.labels = [{name: "For Backlog Bug"}]

    await addMilestoneLabelsToPRs(api, pr, getFakeLogger())

    expect(mockAPI.issues.replaceLabels).toHaveBeenCalledWith({
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
      labels: ["For Milestone Bug"]
    })
  })
})

import { beforeEach, describe, expect, it, vi } from "vitest"
import { addMilestoneLabelsToRelatedPRs } from "./addMilestoneLabelsToRelatedPRs.js"
import { createMockGitHubClient, getIssueFixture } from "../util/tests/createMockGitHubClient.js"
import { getFakeLogger } from "../util/tests/createMockContext.js"
import { getRelatedPRs } from "../issue_meta/getRelatedPRs.js"
import { getRelatedIssues } from "../pr_meta/getRelatedIssues.js"

vi.mock("../issue_meta/getRelatedPRs.js")
vi.mock("../pr_meta/getRelatedIssues.js")

const mockGetRelatedPRs = vi.mocked(getRelatedPRs)
const mockGetRelatedIssues = vi.mocked(getRelatedIssues)

beforeEach(() => {
  mockGetRelatedPRs.mockResolvedValue([{
    number: 1234,
    labels: ["For Uncommitted Bug"],
  }])
})

describe(addMilestoneLabelsToRelatedPRs, () => {
  it("skips actions that cannot affect classification", async () => {
    const { mockAPI, api } = createMockGitHubClient()

    await addMilestoneLabelsToRelatedPRs(api, getIssueFixture("opened"), getFakeLogger())

    expect(mockAPI.issues.addLabels).not.toHaveBeenCalled()
    expect(mockGetRelatedPRs).not.toHaveBeenCalled()
  })

  it("skips closed issues", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getIssueFixture("milestoned")
    payload.issue.state = "closed"

    await addMilestoneLabelsToRelatedPRs(api, payload, getFakeLogger())

    expect(mockAPI.issues.addLabels).not.toHaveBeenCalled()
  })

  it.each(["milestoned", "demilestoned", "assigned", "unassigned"] as const)(
    "recomputes related PRs when an issue is %s",
    async (action) => {
      const { api } = createMockGitHubClient()
      const payload = getIssueFixture("milestoned")
      payload.action = action
      mockGetRelatedIssues.mockResolvedValue([] as any)

      await addMilestoneLabelsToRelatedPRs(api, payload, getFakeLogger())

      expect(mockGetRelatedIssues).toHaveBeenCalledWith(
        payload.repository.owner.login,
        payload.repository.name,
        1234,
        api
      )
    }
  )

  it("classifies from all issues closed by the PR", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getIssueFixture("milestoned")
    mockGetRelatedIssues.mockResolvedValue([
      { milestone: { title: "TypeScript 7.1" }, assignees: [] },
      { milestone: { title: "Backlog" }, assignees: [] },
    ] as any)

    await addMilestoneLabelsToRelatedPRs(api, payload, getFakeLogger())

    expect(mockAPI.issues.removeLabel).toHaveBeenCalledWith({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: 1234,
      name: "For Uncommitted Bug",
    })
    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: 1234,
      labels: ["For Milestone Bug", "For Backlog Bug"],
    })
  })
})

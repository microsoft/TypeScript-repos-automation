jest.mock("../pr_meta/getRelatedIssues")
jest.mock("../pr_meta/isMemberOfTSTeam")

import { addCommentToUncommittedPRs } from "./addCommentToUncommittedPRs"
import { createMockGitHubClient, getPRFixture } from "../util/tests/createMockGitHubClient"
import { getFakeLogger } from "../util/tests/createMockContext"

import { getRelatedIssues } from "../pr_meta/getRelatedIssues"
import { isMemberOfTSTeam } from "../pr_meta/isMemberOfTSTeam"
const mockGetRelatedIssues = (getRelatedIssues as any) as jest.Mock
const mockIsMember = (isMemberOfTSTeam as any) as jest.Mock

describe(addCommentToUncommittedPRs, () => {
  it("Adds a comment to an uncommented, unlinked PR", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockAPI.issues.listComments.mockResolvedValue({ data: [] })
    const pr = getPRFixture("opened")
    pr.pull_request.body = "Cool Ghosts"

    await addCommentToUncommittedPRs(api, pr, getFakeLogger())

    expect(mockAPI.issues.createComment).toHaveBeenCalledWith({
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
      body: "This PR doesn't have any linked issues. Please open an issue that references this PR. From there we can discuss and prioritise.",
    })
    expect(mockAPI.issues.removeLabel).not.toHaveBeenCalled()
  })

  it("Adds a comment to an uncommented PR linked to uncommitted suggestion", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockAPI.issues.listComments.mockResolvedValue({ data: [] })
    mockGetRelatedIssues.mockResolvedValue([{ number: 1, labels: [{ name: "Suggestion" }] }])
    mockIsMember.mockResolvedValue(false)

    const pr = getPRFixture("opened")
    pr.pull_request.body = `fixes #1`

    await addCommentToUncommittedPRs(api, pr, getFakeLogger())

    expect(mockAPI.issues.createComment).toHaveBeenCalledWith({
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
      body: "The TypeScript team hasn't accepted the linked issue #1. If you can get it accepted, this PR will have a better chance of being reviewed."
    })
  })
  it("Does not add a comment to an uncommented PR linked to an uncommitted suggestion from the TS team", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockAPI.issues.listComments.mockResolvedValue({ data: [] })
    mockGetRelatedIssues.mockResolvedValue([{ number: 1, labels: [{ name: "Suggestion" }] }])
    mockIsMember.mockResolvedValue(true)

    const pr = getPRFixture("opened")
    pr.pull_request.body = `fixes #1`

    await addCommentToUncommittedPRs(api, pr, getFakeLogger())

    expect(mockAPI.issues.createComment).not.toHaveBeenCalled()
  })
  for (const allowed of ["Experience Enhancement", "Committed", "help wanted"]) {
    it("Does not add a comment to an uncommented PR linked to a suggestion with the label " + allowed, async () => {
      const { mockAPI, api } = createMockGitHubClient()
      mockAPI.issues.listComments.mockResolvedValue({ data: [] })
      mockGetRelatedIssues.mockResolvedValue([{ number: 1, labels: [{ name: "Suggestion" }, { name: allowed }] }])
      mockIsMember.mockResolvedValue(false)

      const pr = getPRFixture("opened")
      pr.pull_request.body = `fixes #1`

      await addCommentToUncommittedPRs(api, pr, getFakeLogger())

      expect(mockAPI.issues.createComment).not.toHaveBeenCalled()
    })
  }

  it("Does not add a comment to an already-commented PR", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockGetRelatedIssues.mockResolvedValue([{ number: 1, labels: [{ name: "Suggestion" }] }])
    mockAPI.issues.listComments.mockResolvedValue({ data: [{ body: "The TypeScript team hasn't accepted the linked issue #1" }] })

    const pr = getPRFixture("opened")
    pr.pull_request.body = `fixes #1123`
    pr.pull_request.labels = [{ name: "For Backlog Bug" }]

    await addCommentToUncommittedPRs(api, pr, getFakeLogger())

    expect(mockAPI.issues.createComment).not.toHaveBeenCalled()
  })
})

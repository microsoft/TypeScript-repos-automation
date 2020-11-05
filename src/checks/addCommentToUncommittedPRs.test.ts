jest.mock("../pr_meta/getRelatedIssues")
jest.mock("../pr_meta/isMemberOfTSTeam")

import { addCommentToUncommittedPRs } from "./addCommentToUncommittedPRs"
import { createMockGitHubClient, getPRFixture } from "../util/tests/createMockGitHubClient"
import { getFakeLogger } from "../util/tests/createMockContext"

import { getRelatedIssues } from "../pr_meta/getRelatedIssues"
import { isMemberOfTSTeam } from "../pr_meta/isMemberOfTSTeam"
import { PRInfo } from "../anyRepoHandlePullRequest"
const mockGetRelatedIssues = (getRelatedIssues as any) as jest.Mock
const mockIsMember = (isMemberOfTSTeam as any) as jest.Mock


describe(addCommentToUncommittedPRs, () => {
  it("Adds a comment to an uncommented, unlinked PR", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockAPI.issues.listComments.mockResolvedValue({ data: [] })
    const pr = getPRFixture("opened")
    pr.pull_request.body = "Cool Ghosts"

    const info = createInfo()
    await addCommentToUncommittedPRs(api, pr, getFakeLogger(),info)

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

    const pr = getPRFixture("opened")
    pr.pull_request.body = `fixes #1`

    const info = createInfo({ relatedIssues: [{ number: 1, labels: [({ name: "Suggestion" })] }]} as any)
    await addCommentToUncommittedPRs(api, pr, getFakeLogger(), info)

    expect(mockAPI.issues.createComment).toHaveBeenCalledWith({
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
      body: "The TypeScript team hasn't accepted the linked issue #1. If you can get it accepted, this PR will have a better chance of being reviewed."
    })
  })

  it("Does not add a comment to an uncommented PR linked to an uncommitted suggestion from the TS team", async () => {
    const { mockAPI, api } = createMockGitHubClient()

    const pr = getPRFixture("opened")
    pr.pull_request.body = `fixes #1`

    const info = createInfo({  authorIsMemberOfTSTeam: true,  relatedIssues: [{ number: 1, labels: [{ name: "Suggestion" }] }] as any} )
    await addCommentToUncommittedPRs(api, pr, getFakeLogger(), info)

    expect(mockAPI.issues.createComment).not.toHaveBeenCalled()
  })

  for (const allowed of ["Experience Enhancement", "Committed", "help wanted"]) {
    it("Does not add a comment to an uncommented PR linked to a suggestion with the label " + allowed, async () => {
      const { mockAPI, api } = createMockGitHubClient()
      
      const pr = getPRFixture("opened")
      pr.pull_request.body = `fixes #1`
      
      const info = createInfo({ relatedIssues: [{ number: 1, labels: [{ name: "Suggestion" }, { name: allowed }] }] as any} )
      await addCommentToUncommittedPRs(api, pr, getFakeLogger(), info)

      expect(mockAPI.issues.createComment).not.toHaveBeenCalled()
    })
  }

  it("Does not add a comment to an already-commented PR", async () => {
    const { mockAPI, api } = createMockGitHubClient()

    const pr = getPRFixture("opened")
    pr.pull_request.body = `fixes #1123`
    pr.pull_request.labels = [{ name: "For Backlog Bug" }]

    const info = createInfo({ 
      comments: [{ body: "The TypeScript team hasn't accepted the linked issue #1" }] as any,
      relatedIssues: [{ number: 1, labels: [{ name: "Suggestion" }] }] as any
    })
    await addCommentToUncommittedPRs(api, pr, getFakeLogger(), info)

    expect(mockAPI.issues.createComment).not.toHaveBeenCalled()
  })
})


const createInfo = (info?: Partial<PRInfo>): PRInfo => {
  return {
    comments: [],
    authorIsMemberOfTSTeam: false,
    relatedIssues: [],
    thisIssue: {
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
    },
    ...info
  }
}

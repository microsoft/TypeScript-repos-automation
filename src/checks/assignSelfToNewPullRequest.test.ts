jest.mock("../pr_meta/isMemberOfTSTeam")

import { assignSelfToNewPullRequest } from "./assignSelfToNewPullRequest"
import { createMockGitHubClient, convertToOctokitAPI, getPRFixture } from "../util/tests/createMockGitHubClient"
import { getFakeLogger } from "../util/tests/createMockContext"

import { isMemberOfTSTeam } from "../pr_meta/isMemberOfTSTeam"
import { User } from "@octokit/webhooks-types"
const mockIsMember = (isMemberOfTSTeam as any) as jest.Mock

describe(assignSelfToNewPullRequest, () => {
  it("NO-OPs when there's assignees already ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const pr = getPRFixture("opened")
    pr.pull_request.assignees = [{ login: "orta" } as Partial<User> as User]

    await assignSelfToNewPullRequest(api, pr, getFakeLogger())

    expect(mockAPI.repos.checkCollaborator).not.toHaveBeenCalled()
    expect(mockAPI.issues.addAssignees).not.toHaveBeenCalledWith()
  })

  it("Sets the assignee when they have write access ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockIsMember.mockResolvedValue(true)
    mockAPI.issues.addAssignees.mockResolvedValue({})

    await assignSelfToNewPullRequest(api, getPRFixture("opened"), getFakeLogger())

    expect(mockAPI.issues.addAssignees).toHaveBeenCalledWith({
      assignees: ["ahejlsberg"],
      id: 35454,
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
    })
  })

  it("Does not set the assignment when they have read access", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockIsMember.mockResolvedValue(false)
    mockAPI.issues.addAssignees.mockResolvedValue({})

    await assignSelfToNewPullRequest(api, getPRFixture("opened"), getFakeLogger())

    expect(mockAPI.issues.addAssignees).not.toHaveBeenCalled()
  })
})

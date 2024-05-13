jest.mock("../pr_meta/getRelatedIssues")

import { assignTeamMemberForRelatedPR } from "./assignTeamMemberForRelatedPR"
import { createMockGitHubClient, getPRFixture } from "../util/tests/createMockGitHubClient"
import { getFakeLogger } from "../util/tests/createMockContext"

import { getRelatedIssues } from "../pr_meta/getRelatedIssues"
import { User } from "@octokit/webhooks-types"
const mockGetRelatedIssues = (getRelatedIssues as any) as jest.Mock

describe(assignTeamMemberForRelatedPR, () => {
  it("NO-OPs when there's assignees already ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const pr = getPRFixture("opened")
    pr.pull_request.assignees = [{ login: "orta" } as Partial<User> as User]

    await assignTeamMemberForRelatedPR(api, pr, getFakeLogger())

    expect(mockAPI.issues.addAssignees).not.toHaveBeenCalledWith()
  })

  it("NO-OPs when the body doesnt have issues ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const pr = getPRFixture("opened")
    pr.pull_request.body = ``

    await assignTeamMemberForRelatedPR(api, pr, getFakeLogger())

    expect(mockAPI.issues.addAssignees).not.toHaveBeenCalledWith()
  })

  it("Sets the assignee when a fixed issue has an assignee", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockGetRelatedIssues.mockResolvedValue([{ assignees: [{ login: "danger" }]}])

    const pr = getPRFixture("opened")
    pr.pull_request.body = `fixes #1123`

    await assignTeamMemberForRelatedPR(api, pr, getFakeLogger())

    expect(mockAPI.issues.addAssignees).toHaveBeenCalledWith({
      assignees: ["danger"],
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
    })
  })
})

import { describe, it, expect } from "vitest"

import { assignSelfToNewPullRequest } from "./assignSelfToNewPullRequest.js"
import { createMockGitHubClient, getPRFixture } from "../util/tests/createMockGitHubClient.js"
import { getFakeLogger } from "../util/tests/createMockContext.js"
import { createPRInfo } from "../util/tests/createPRInfo.js"
import { User } from "@octokit/webhooks-types"

describe(assignSelfToNewPullRequest, () => {
  it("does not assign closed pull requests", async () => {
    const { mockAPI, api } = createMockGitHubClient()

    await assignSelfToNewPullRequest(api, getPRFixture("closed"), getFakeLogger(), createPRInfo())

    expect(mockAPI.issues.addAssignees).not.toHaveBeenCalled()
  })

  it("NO-OPs when there's assignees already ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const pr = getPRFixture("opened")
    pr.pull_request.assignees = [{ login: "orta" } as Partial<User> as User]

    await assignSelfToNewPullRequest(api, pr, getFakeLogger(), createPRInfo())

    expect(mockAPI.repos.checkCollaborator).not.toHaveBeenCalled()
    expect(mockAPI.issues.addAssignees).not.toHaveBeenCalledWith()
  })

  it("Sets the assignee when they have write access ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockAPI.issues.addAssignees.mockResolvedValue({})

    await assignSelfToNewPullRequest(
      api,
      getPRFixture("opened"),
      getFakeLogger(),
      createPRInfo({ effectiveAuthor: "ahejlsberg", authorIsMemberOfTSTeam: true })
    )

    expect(mockAPI.issues.addAssignees).toHaveBeenCalledWith({
      assignees: ["ahejlsberg"],
      id: 35454,
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
    })
  })

  it("assigns a Copilot pull request to the team member who initiated it", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const pr = getPRFixture("opened")
    pr.pull_request.user.login = "Copilot"

    await assignSelfToNewPullRequest(
      api,
      pr,
      getFakeLogger(),
      createPRInfo({ effectiveAuthor: "RyanCavanaugh", authorIsMemberOfTSTeam: true })
    )

    expect(mockAPI.issues.addAssignees).toHaveBeenCalledWith({
      assignees: ["RyanCavanaugh"],
      id: 35454,
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
    })
  })

  it("Does not set the assignment when they have read access", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockAPI.issues.addAssignees.mockResolvedValue({})

    await assignSelfToNewPullRequest(api, getPRFixture("opened"), getFakeLogger(), createPRInfo())

    expect(mockAPI.issues.addAssignees).not.toHaveBeenCalled()
  })
})

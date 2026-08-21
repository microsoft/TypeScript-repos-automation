import { describe, it, expect } from "vitest"

import { assignTeamMemberForRelatedPR } from "./assignTeamMemberForRelatedPR.js"
import { createMockGitHubClient, getPRFixture } from "../util/tests/createMockGitHubClient.js"
import { getFakeLogger } from "../util/tests/createMockContext.js"
import { createPRInfo } from "../util/tests/createPRInfo.js"
import { User } from "@octokit/webhooks-types"

describe(assignTeamMemberForRelatedPR, () => {
  it("does not assign closed pull requests", async () => {
    const { mockAPI, api } = createMockGitHubClient()

    await assignTeamMemberForRelatedPR(api, getPRFixture("closed"), getFakeLogger(), createPRInfo())

    expect(mockAPI.issues.addAssignees).not.toHaveBeenCalled()
  })

  it("NO-OPs when there's assignees already ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const pr = getPRFixture("opened")
    pr.pull_request.assignees = [{ login: "orta" } as Partial<User> as User]

    await assignTeamMemberForRelatedPR(api, pr, getFakeLogger(), createPRInfo())

    expect(mockAPI.issues.addAssignees).not.toHaveBeenCalledWith()
  })

  it("NO-OPs when the body doesnt have issues ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const pr = getPRFixture("opened")
    pr.pull_request.body = ``

    await assignTeamMemberForRelatedPR(api, pr, getFakeLogger(), createPRInfo())

    expect(mockAPI.issues.addAssignees).not.toHaveBeenCalledWith()
  })

  it("Sets the assignee when a fixed issue has an assignee", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const pr = getPRFixture("opened")
    pr.pull_request.body = `fixes #1123`

    await assignTeamMemberForRelatedPR(
      api,
      pr,
      getFakeLogger(),
      createPRInfo({ relatedIssues: [{ assignees: [{ login: "danger" }] }] as any })
    )

    expect(mockAPI.issues.addAssignees).toHaveBeenCalledWith({
      assignees: ["danger"],
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
    })
  })

  it("deduplicates assignees shared by related issues", async () => {
    const { mockAPI, api } = createMockGitHubClient()

    await assignTeamMemberForRelatedPR(
      api,
      getPRFixture("opened"),
      getFakeLogger(),
      createPRInfo({
        relatedIssues: [
          { assignees: [{ login: "danger" }] },
          { assignees: [{ login: "danger" }] },
        ] as any,
      })
    )

    expect(mockAPI.issues.addAssignees).toHaveBeenCalledWith({
      assignees: ["danger"],
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
    })
  })
})

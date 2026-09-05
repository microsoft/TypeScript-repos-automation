import { describe, expect, it } from "vitest"
import { isMemberOfTSTeam } from "./isMemberOfTSTeam.js"
import { createMockGitHubClient } from "../util/tests/createMockGitHubClient.js"
import { getFakeLogger } from "../util/tests/createMockContext.js"

describe(isMemberOfTSTeam, () => {
  it("considers Copilot a team member without checking team membership", async () => {
    const { mockAPI, api } = createMockGitHubClient()

    await expect(isMemberOfTSTeam("Copilot", api, getFakeLogger())).resolves.toBe(true)
    expect(mockAPI.teams.getMembershipForUserInOrg).not.toHaveBeenCalled()
  })

  it("checks for active membership in the microsoft/typescript team", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockAPI.teams.getMembershipForUserInOrg.mockResolvedValue({ data: { state: "active" } })

    await expect(isMemberOfTSTeam("octocat", api, getFakeLogger())).resolves.toBe(true)
    expect(mockAPI.teams.getMembershipForUserInOrg).toHaveBeenCalledWith({
      org: "microsoft",
      team_slug: "typescript",
      username: "octocat",
    })
  })

  it("does not consider pending membership active", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockAPI.teams.getMembershipForUserInOrg.mockResolvedValue({ data: { state: "pending" } })

    await expect(isMemberOfTSTeam("octocat", api, getFakeLogger())).resolves.toBe(false)
  })

  it("returns false when the user is not a team member", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockAPI.teams.getMembershipForUserInOrg.mockRejectedValue({ status: 404 })

    await expect(isMemberOfTSTeam("octocat", api, getFakeLogger())).resolves.toBe(false)
  })

  it("propagates other GitHub API errors", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const error = { status: 403 }
    mockAPI.teams.getMembershipForUserInOrg.mockRejectedValue(error)

    await expect(isMemberOfTSTeam("octocat", api, getFakeLogger())).rejects.toBe(error)
  })
})

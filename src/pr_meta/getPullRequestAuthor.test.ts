import { describe, expect, it } from "vitest"
import { getPullRequestAuthor } from "./getPullRequestAuthor.js"
import { createMockGitHubClient, getPRFixture } from "../util/tests/createMockGitHubClient.js"

describe(getPullRequestAuthor, () => {
  it("returns an ordinary pull request's author", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getPRFixture("opened")

    await expect(getPullRequestAuthor(api, payload)).resolves.toBe("ahejlsberg")
    expect(mockAPI.paginate).not.toHaveBeenCalled()
  })

  it("returns the user who initiated a Copilot pull request", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getPRFixture("opened")
    payload.pull_request.user.login = "Copilot"
    mockAPI.paginate.mockResolvedValue([
      {
        event: "copilot_work_started",
        actor: { login: "RyanCavanaugh" },
      },
    ])

    await expect(getPullRequestAuthor(api, payload)).resolves.toBe("RyanCavanaugh")
    expect(mockAPI.paginate).toHaveBeenCalledWith(mockAPI.issues.listEventsForTimeline, {
      owner: "microsoft",
      repo: "TypeScript",
      issue_number: 35454,
    })
  })

  it("falls back to Copilot when the initiator is unavailable", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getPRFixture("opened")
    payload.pull_request.user.login = "Copilot"
    mockAPI.paginate.mockResolvedValue([])

    await expect(getPullRequestAuthor(api, payload)).resolves.toBe("Copilot")
  })
})

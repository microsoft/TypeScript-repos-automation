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
        created_at: "2019-12-02T23:26:10Z",
        actor: { login: "RyanCavanaugh" },
        performed_via_github_app: { slug: "copilot-swe-agent" },
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

  it("ignores Copilot review work", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getPRFixture("opened")
    payload.pull_request.user.login = "Copilot"
    mockAPI.paginate.mockResolvedValue([
      {
        event: "copilot_work_started",
        created_at: "2019-12-03T00:00:00Z",
        actor: { login: "RyanCavanaugh" },
        performed_via_github_app: { slug: "copilot-pull-request-reviewer" },
      },
    ])

    await expect(getPullRequestAuthor(api, payload)).resolves.toBe("Copilot")
  })

  it("ignores Copilot agent work started outside the author window", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getPRFixture("opened")
    payload.pull_request.user.login = "Copilot"
    mockAPI.paginate.mockResolvedValue([
      {
        event: "copilot_work_started",
        created_at: "2019-12-03T00:00:00Z",
        actor: { login: "RyanCavanaugh" },
        performed_via_github_app: { slug: "copilot-swe-agent" },
      },
    ])

    await expect(getPullRequestAuthor(api, payload)).resolves.toBe("Copilot")
  })
})

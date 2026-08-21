import { beforeEach, describe, expect, it, vi } from "vitest"
import { handleIssuePayload } from "../anyRepoHandleIssue.js"
import { handlePullRequestPayload } from "../anyRepoHandlePullRequest.js"
import { createGitHubClient } from "../util/createGitHubClient.js"
import { createMockContext } from "../util/tests/createMockContext.js"
import { getIssueFixture, getPRFixture } from "../util/tests/createMockGitHubClient.js"

vi.mock("../util/createGitHubClient.js")

const mockCreateGitHubClient = vi.mocked(createGitHubClient)

beforeEach(() => {
  vi.clearAllMocks()
})

describe(handlePullRequestPayload, () => {
  it("does not authenticate for closed pull requests", async () => {
    const response = await handlePullRequestPayload(getPRFixture("closed"), createMockContext())

    expect(response.body).toBe("Success, NOOP")
    expect(mockCreateGitHubClient).not.toHaveBeenCalled()
  })

  it("does not authenticate for another owner's TypeScript repository", async () => {
    const payload = getPRFixture("opened")
    payload.repository.owner.login = "other"

    const response = await handlePullRequestPayload(payload, createMockContext())

    expect(response.body).toBe("Success, NOOP")
    expect(mockCreateGitHubClient).not.toHaveBeenCalled()
  })
})

describe(handleIssuePayload, () => {
  it("does not authenticate for another owner's TypeScript repository", async () => {
    const payload = getIssueFixture("milestoned")
    payload.repository.owner.login = "other"

    const response = await handleIssuePayload(payload, createMockContext())

    expect(response.body).toBe("Success, NOOP")
    expect(mockCreateGitHubClient).not.toHaveBeenCalled()
  })
})

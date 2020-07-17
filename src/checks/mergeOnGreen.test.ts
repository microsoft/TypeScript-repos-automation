import { createMockGitHubClient } from "../util/tests/createMockGitHubClient"
import { getFakeLogger } from "../util/tests/createMockContext"

import { mergeOnGreen } from "./mergeOnGreen"

describe("for handling merging when green", () => {
  it("bails when its not a success", async () => {
    const { api } = createMockGitHubClient()
    const logger = getFakeLogger()

    await mergeOnGreen(api, { state: "fail" } as any, logger)
    expect(logger.info).toBeCalled()
  })

  it("bails when the whole status is not a success", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const logger = getFakeLogger()
    mockAPI.checks.listForRef.mockResolvedValueOnce({ data: { check_runs: [{ conclusion: "FAILED" }]}})

    const webhook = {
      state: "success",
      repository: { owner: { login: "danger" }, name: "doggo" },
      commit: { sha: "123abc" },
    } as any

    await mergeOnGreen(api, webhook, logger)

    expect(logger.info).toBeCalledWith("Not all statuses are green")
  })

  it("does nothing when the PR does not have merge on green", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const logger = getFakeLogger()

    // Says al CI statuses are green
    mockAPI.checks.listForRef.mockResolvedValueOnce({ data: { check_runs: [{ conclusion: "SUCCESS" }]}})

    // Gets a corresponding issue
    mockAPI.search.issues.mockResolvedValueOnce({ data: { items: [{ number: 1 }] } })

    // Returns an issue without the merge on green label
    mockAPI.issues.get.mockResolvedValueOnce({ data: { labels: [{ name: "Dog Snoozer" }] } })

    const webhook = {
      state: "success",
      repository: { owner: { login: "danger" }, name: "doggo" },
      commit: { sha: "123abc" },
    } as any

    await mergeOnGreen(api, webhook, logger)

    expect(logger.info).toBeCalledWith("PR 1 does not have Merge on Green")
  })

  it("triggers a PR merge when there is a merge on green label", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const logger = getFakeLogger()

    // Says al CI statuses are green
    mockAPI.checks.listForRef.mockResolvedValueOnce({ data: { check_runs: [{ conclusion: "SUCCESS" }]}})

    // Gets a corresponding issue
    mockAPI.search.issues.mockResolvedValueOnce({ data: { items: [{ number: 1 }] } })

    // Returns an issue without the merge on green label
    mockAPI.issues.get.mockResolvedValueOnce({ data: { labels: [{ name: "Merge On Green" }] } })

    const webhook = {
      state: "success",
      repository: { owner: { login: "danger" }, name: "doggo" },
      commit: { sha: "123abc" },
    } as any

    await mergeOnGreen(api, webhook, logger)

    expect(mockAPI.pulls.merge).toBeCalledWith({
      commit_title: "Merge pull request #1 by microsoft/typescript-repos-automation",
      number: 1,
      owner: "danger",
      repo: "doggo",
    })
  })
})

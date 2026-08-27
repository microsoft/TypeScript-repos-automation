import { describe, expect, it } from "vitest"
import { closeGeneratedDomLibPRs, generatedDomLibFiles } from "./closeGeneratedDomLibPRs.js"
import { createMockGitHubClient, getPRFixture } from "../util/tests/createMockGitHubClient.js"
import { getFakeLogger } from "../util/tests/createMockContext.js"
import { createPRInfo } from "../util/tests/createPRInfo.js"

describe(closeGeneratedDomLibPRs, () => {
  it.each(generatedDomLibFiles)("closes an external PR that modifies %s", async filename => {
    const { mockAPI, api } = createMockGitHubClient()
    mockAPI.paginate.mockResolvedValue([{ filename }])

    const closed = await closeGeneratedDomLibPRs(
      api,
      getPRFixture("opened"),
      getFakeLogger(),
      createPRInfo(),
    )

    expect(closed).toBe(true)
    expect(mockAPI.issues.createComment).toHaveBeenCalledWith({
      owner: "microsoft",
      repo: "TypeScript",
      issue_number: 35454,
      body: expect.stringContaining("TypeScript-DOM-lib-generator"),
    })
    expect(mockAPI.pulls.update).toHaveBeenCalledWith({
      owner: "microsoft",
      repo: "TypeScript",
      pull_number: 35454,
      state: "closed",
    })
  })

  it("does not close a team member's PR", async () => {
    const { mockAPI, api } = createMockGitHubClient()

    const closed = await closeGeneratedDomLibPRs(
      api,
      getPRFixture("opened"),
      getFakeLogger(),
      createPRInfo({ authorIsMemberOfTSTeam: true }),
    )

    expect(closed).toBe(false)
    expect(mockAPI.paginate).not.toHaveBeenCalled()
    expect(mockAPI.pulls.update).not.toHaveBeenCalled()
  })

  it("does not close a bot's PR", async () => {
    const { mockAPI, api } = createMockGitHubClient()

    const closed = await closeGeneratedDomLibPRs(
      api,
      getPRFixture("opened"),
      getFakeLogger(),
      createPRInfo({ authorIsBot: true }),
    )

    expect(closed).toBe(false)
    expect(mockAPI.paginate).not.toHaveBeenCalled()
    expect(mockAPI.pulls.update).not.toHaveBeenCalled()
  })

  it("does not close a PR that only modifies other files", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockAPI.paginate.mockResolvedValue([{ filename: "src/compiler/checker.ts" }])

    const closed = await closeGeneratedDomLibPRs(
      api,
      getPRFixture("opened"),
      getFakeLogger(),
      createPRInfo(),
    )

    expect(closed).toBe(false)
    expect(mockAPI.issues.createComment).not.toHaveBeenCalled()
    expect(mockAPI.pulls.update).not.toHaveBeenCalled()
  })

  it("does not repeat the explanation comment", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockAPI.paginate.mockResolvedValue([{ filename: generatedDomLibFiles[0] }])

    await closeGeneratedDomLibPRs(
      api,
      getPRFixture("opened"),
      getFakeLogger(),
      createPRInfo({
        comments: [{
          body: "It looks like you've sent a pull request that updates generated declaration files related to the DOM.",
        }] as any,
      }),
    )

    expect(mockAPI.issues.createComment).not.toHaveBeenCalled()
    expect(mockAPI.pulls.update).toHaveBeenCalled()
  })
})

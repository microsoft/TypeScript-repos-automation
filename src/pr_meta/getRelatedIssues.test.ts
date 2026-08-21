import { describe, expect, it } from "vitest"
import { getRelatedIssues } from "./getRelatedIssues.js"
import { createMockGitHubClient } from "../util/tests/createMockGitHubClient.js"

const response = (
  issues: { number: number; repository: string }[],
  hasNextPage: boolean,
  endCursor: string | null
) => ({
  repository: {
    pullRequest: {
      closingIssuesReferences: {
        nodes: issues.map(({ number, repository }) => ({
          number,
          repository: { nameWithOwner: repository },
        })),
        pageInfo: { hasNextPage, endCursor },
      },
    },
  },
})

describe(getRelatedIssues, () => {
  it("loads GitHub-resolved closing issues from the base repository", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockAPI.graphql.mockResolvedValue(response([
      { number: 1, repository: "microsoft/TypeScript" },
      { number: 2, repository: "other/repo" },
    ], false, null))
    mockAPI.issues.get.mockResolvedValue({ data: { number: 1 } })

    await expect(getRelatedIssues("microsoft", "TypeScript", 123, api)).resolves.toEqual([
      { number: 1 },
    ])
    expect(mockAPI.graphql).toHaveBeenCalledWith(
      expect.stringContaining("excludeUserLinked: true"),
      {
        owner: "microsoft",
        repo: "TypeScript",
        pullRequest: 123,
        cursor: null,
      }
    )
    expect(mockAPI.issues.get).toHaveBeenCalledWith({
      issue_number: 1,
      owner: "microsoft",
      repo: "TypeScript",
    })
  })

  it("paginates closing issues", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockAPI.graphql
      .mockResolvedValueOnce(response([{ number: 1, repository: "microsoft/TypeScript" }], true, "next"))
      .mockResolvedValueOnce(response([{ number: 2, repository: "microsoft/TypeScript" }], false, null))
    mockAPI.issues.get
      .mockResolvedValueOnce({ data: { number: 1 } })
      .mockResolvedValueOnce({ data: { number: 2 } })

    await expect(getRelatedIssues("microsoft", "TypeScript", 123, api)).resolves.toEqual([
      { number: 1 },
      { number: 2 },
    ])
    expect(mockAPI.graphql).toHaveBeenCalledTimes(2)
  })
})

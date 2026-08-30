import { describe, expect, it } from "vitest"
import { getRelatedPRs, getRelatedPRsResponseData } from "./getRelatedPRs.js"
import { createMockGitHubClient } from "../util/tests/createMockGitHubClient.js"

const response = (
  number: number,
  hasNextPage: boolean,
  endCursor: string | null
): getRelatedPRsResponseData => ({
  repository: {
    issue: {
      closedByPullRequestsReferences: {
        pageInfo: { hasNextPage, endCursor },
        edges: [{
          node: {
            number,
            repository: { nameWithOwner: "microsoft/TypeScript" },
          },
        }],
      },
    },
  },
})

describe(getRelatedPRs, () => {
  it("paginates closing pull requests and loads their complete labels", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockAPI.graphql
      .mockResolvedValueOnce(response(100, true, "next"))
      .mockResolvedValueOnce(response(200, false, null))
    mockAPI.issues.get
      .mockResolvedValueOnce({ data: { labels: [{ name: "For Backlog Bug" }] } })
      .mockResolvedValueOnce({ data: { labels: ["Other"] } })

    await expect(getRelatedPRs("microsoft", "TypeScript", 1, api)).resolves.toEqual([
      { number: 100, labels: ["For Backlog Bug"] },
      { number: 200, labels: ["Other"] },
    ])
    expect(mockAPI.graphql).toHaveBeenCalledTimes(2)
    expect(mockAPI.issues.get).toHaveBeenCalledTimes(2)

    const query: unknown = mockAPI.graphql.mock.calls[0]?.[0]
    expect(typeof query).toBe("string")
    if (typeof query !== "string") throw new Error("Expected a GraphQL query")
    let braceDepth = 0
    for (const character of query) {
      if (character === "{") braceDepth++
      if (character === "}") braceDepth--
      expect(braceDepth).toBeGreaterThanOrEqual(0)
    }
    expect(braceDepth).toBe(0)
  })

  it("rejects an incomplete pagination response", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockAPI.graphql.mockResolvedValue(response(100, true, null))
    mockAPI.issues.get.mockResolvedValue({ data: { labels: [] } })

    await expect(getRelatedPRs("microsoft", "TypeScript", 1, api)).rejects.toThrow(
      "GitHub returned another related-PR page without a cursor"
    )
  })
})

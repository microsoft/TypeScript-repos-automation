import { Octokit, RestEndpointMethodTypes } from "@octokit/rest"

interface ClosingIssuesResponse {
  repository: {
    pullRequest: {
      closingIssuesReferences: {
        nodes: {
          number: number
          repository: {
            nameWithOwner: string
          }
        }[]
        pageInfo: {
          hasNextPage: boolean
          endCursor: string | null
        }
      }
    }
  }
}

export const getRelatedIssues = async (owner: string, name: string, pullRequest: number, api: Octokit) => {
  const issues: RestEndpointMethodTypes["issues"]["get"]["response"]["data"][] = []
  let cursor: string | null = null

  do {
    const response: ClosingIssuesResponse = await api.graphql(
      `
      query getRelatedIssues($owner: String!, $repo: String!, $pullRequest: Int!, $cursor: String) {
        repository(owner: $owner, name: $repo) {
          pullRequest(number: $pullRequest) {
            closingIssuesReferences(first: 100, after: $cursor, excludeUserLinked: true) {
              nodes {
                number
                repository {
                  nameWithOwner
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      }
      `,
      {
        owner,
        repo: name,
        pullRequest,
        cursor,
      }
    )

    const connection = response.repository.pullRequest.closingIssuesReferences
    for (const issue of connection.nodes) {
      if (issue.repository.nameWithOwner.toLowerCase() !== `${owner}/${name}`.toLowerCase()) {
        continue
      }

      const issueResponse = await api.issues.get({
        issue_number: issue.number,
        owner,
        repo: name,
      })
      issues.push(issueResponse.data)
    }

    if (!connection.pageInfo.hasNextPage) {
      cursor = null
    } else if (connection.pageInfo.endCursor) {
      cursor = connection.pageInfo.endCursor
    } else {
      throw new Error("GitHub returned another closing-issues page without a cursor")
    }
  } while (cursor)

  return issues
}

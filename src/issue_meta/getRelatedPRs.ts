import { Octokit } from "@octokit/rest";

export interface getRelatedPRsResponseData {
  repository: {
    issue: {
      closedByPullRequestsReferences: {
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
        edges: {
          node: {
            number: number;
            repository: {
              nameWithOwner: string;
            };
          };
        }[];
      };
    };
  };
}

export const getRelatedPRs = async (
  owner: string,
  name: string,
  issue: number,
  api: Octokit
) => {
  const prs: { number: number; labels: string[] }[] = [];
  let cursor: string | null = null;

  do {
    const response: getRelatedPRsResponseData = await api.graphql(
      `
      query getRelatedPRs($owner: String!, $repo: String!, $issue: Int!, $cursor: String) {
        repository(owner: $owner, name: $repo) {
          issue(number: $issue) {
            closedByPullRequestsReferences(first: 100, after: $cursor) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                node {
                  number
                  repository {
                    nameWithOwner
                  }
                }
              }
            }
          }
        }
      }
      `,
      {
        owner,
        repo: name,
        issue,
        cursor,
      }
    );

    const connection = response.repository.issue.closedByPullRequestsReferences;
    for (const edge of connection.edges) {
      if (edge.node.repository.nameWithOwner.toLowerCase() !== `${owner}/${name}`.toLowerCase()) {
        continue;
      }

      const pr = await api.issues.get({
        owner,
        repo: name,
        issue_number: edge.node.number,
      });
      const labels = pr.data.labels
        .map((label) => typeof label === "string" ? label : label.name)
        .filter((label): label is string => label !== undefined);
      prs.push({ number: edge.node.number, labels });
    }

    if (!connection.pageInfo.hasNextPage) {
      cursor = null;
    } else if (connection.pageInfo.endCursor) {
      cursor = connection.pageInfo.endCursor;
    } else {
      throw new Error("GitHub returned another related-PR page without a cursor");
    }
  } while (cursor);

  return prs;
};

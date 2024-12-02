import { Octokit } from "@octokit/rest";

export interface getRelatedPRsResponseData {
  repository: {
    issue: {
      closedByPullRequestsReferences: {
        edges: {
          node: {
            number: number;
            repository: {
              nameWithOwner: string;
            };
            labels: {
              edges: {
                node: {
                  name: string;
                };
              }[];
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
  const response = await api.graphql<getRelatedPRsResponseData>(
    `
    query getRelatedPRs($owner: String!, $repo: String!, $issue: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $issue) {
          closedByPullRequestsReferences(last: 10) {
            edges {
              node {
                number
                repository {
                  nameWithOwner
                }
                labels(last: 10) {
                  edges {
                    node {
                      name
                    }
                  }
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
    }
  );

  return response.repository.issue.closedByPullRequestsReferences.edges
    .filter((edge) => edge.node.repository.nameWithOwner === `${owner}/${name}`)
    .map((edge) => ({
      number: edge.node.number,
      labels: edge.node.labels.edges.map((edge) => edge.node.name),
    }));
};

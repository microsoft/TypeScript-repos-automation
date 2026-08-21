import { describe, it, expect } from "vitest"
import { addMilestoneLabelsToRelatedPRs } from "./addMilestoneLabelsToRelatedPRs.js";
import {
  createMockGitHubClient,
  getIssueFixture,
} from "../util/tests/createMockGitHubClient.js";
import { getFakeLogger } from "../util/tests/createMockContext.js";

import { IssuesEvent } from "@octokit/webhooks-types";
import { getRelatedPRsResponseData } from "../issue_meta/getRelatedPRs.js";

function getRelatedPRMock(
): getRelatedPRsResponseData {
  return {
    repository: {
      issue: {
        closedByPullRequestsReferences: {
          pageInfo: {
            hasNextPage: false,
            endCursor: null,
          },
          edges: [
            {
              node: {
                number: 1234,
                repository: {
                  nameWithOwner: "microsoft/TypeScript",
                },
              },
            },
          ],
        },
      },
    },
  };
}

const mockRelatedPR = (mockAPI: ReturnType<typeof createMockGitHubClient>["mockAPI"], labels = ["For Uncommitted Bug"]) => {
  mockAPI.graphql.mockResolvedValue(getRelatedPRMock());
  mockAPI.issues.get.mockResolvedValue({
    data: {
      labels: labels.map((name) => ({ name })),
    },
  });
}

describe("addMilestoneLabelsToRelatedPRs", () => {
  it("Skips when the action is not 'milestoned'", async () => {
    const { mockAPI, api } = createMockGitHubClient();
    const payload: IssuesEvent = getIssueFixture("opened");

    await addMilestoneLabelsToRelatedPRs(api, payload, getFakeLogger());

    expect(mockAPI.issues.addLabels).not.toHaveBeenCalled();
  });

  it("Skips when the issue is closed", async () => {
    const { mockAPI, api } = createMockGitHubClient();
    const payload: IssuesEvent = getIssueFixture("milestoned");
    payload.issue.state = "closed";

    await addMilestoneLabelsToRelatedPRs(api, payload, getFakeLogger());

    expect(mockAPI.issues.addLabels).not.toHaveBeenCalled();
  });

  it("Adds 'For Milestone Bug' label to related PRs", async () => {
    const { mockAPI, api } = createMockGitHubClient();
    const payload: IssuesEvent = getIssueFixture("milestoned");
    payload.action = "milestoned";
    payload.issue.milestone!.title = "TypeScript 5.8.0";

    mockRelatedPR(mockAPI);

    await addMilestoneLabelsToRelatedPRs(api, payload, getFakeLogger());

    expect(mockAPI.issues.removeLabel).toHaveBeenCalledWith({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: 1234,
      name: "For Uncommitted Bug",
    });
    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: 1234,
      labels: ["For Milestone Bug"],
    });
    expect(mockAPI.issues.addLabels).toHaveBeenCalledTimes(1);
  });

  it("Adds 'For Backlog Bug' label if milestone is Backlog", async () => {
    const { mockAPI, api } = createMockGitHubClient();
    const payload: IssuesEvent = getIssueFixture("milestoned");
    payload.action = "milestoned";
    payload.issue.milestone!.title = "Backlog";

    mockRelatedPR(mockAPI);

    await addMilestoneLabelsToRelatedPRs(api, payload, getFakeLogger());

    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: 1234,
      labels: ["For Backlog Bug"],
    });
  });

  it("replaces a stale milestone classification label", async () => {
    const { mockAPI, api } = createMockGitHubClient();
    const payload: IssuesEvent = getIssueFixture("milestoned");
    payload.issue.milestone!.title = "TypeScript 5.8.0";

    mockRelatedPR(mockAPI, ["For Backlog Bug"]);

    await addMilestoneLabelsToRelatedPRs(api, payload, getFakeLogger());

    expect(mockAPI.issues.removeLabel).toHaveBeenCalledWith({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: 1234,
      name: "For Backlog Bug",
    });
    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: 1234,
      labels: ["For Milestone Bug"],
    });
  });

  it("Skips when no new labels need to be added", async () => {
    const { mockAPI, api } = createMockGitHubClient();
    const payload: IssuesEvent = getIssueFixture("milestoned");
    payload.action = "milestoned";
    payload.issue.milestone!.title = "Backlog";

    mockRelatedPR(mockAPI, ["For Backlog Bug"]);

    await addMilestoneLabelsToRelatedPRs(api, payload, getFakeLogger());

    expect(mockAPI.issues.removeLabel).not.toHaveBeenCalled();
    expect(mockAPI.issues.addLabels).not.toHaveBeenCalled();
  });
});

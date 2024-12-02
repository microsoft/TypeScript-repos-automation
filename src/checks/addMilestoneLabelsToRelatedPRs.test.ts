import { addMilestoneLabelsToRelatedPRs } from "./addMilestoneLabelsToRelatedPRs";
import {
  createMockGitHubClient,
  getIssueFixture,
} from "../util/tests/createMockGitHubClient";
import { getFakeLogger } from "../util/tests/createMockContext";

import { IssuesEvent } from "@octokit/webhooks-types";
import { getRelatedPRsResponseData } from "../issue_meta/getRelatedPRs";

function getRelatedPRMock(
  labels: string[] = ["For Uncommitted Bug"]
): getRelatedPRsResponseData {
  return {
    repository: {
      issue: {
        closedByPullRequestsReferences: {
          edges: [
            {
              node: {
                number: 1234,
                repository: {
                  nameWithOwner: "microsoft/TypeScript",
                },
                labels: {
                  edges: labels.map((l) => ({ node: { name: l } })),
                },
              },
            },
          ],
        },
      },
    },
  };
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

    mockAPI.graphql.mockResolvedValue(getRelatedPRMock());

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
  });

  it("Adds 'For Backlog Bug' label if milestone is Backlog", async () => {
    const { mockAPI, api } = createMockGitHubClient();
    const payload: IssuesEvent = getIssueFixture("milestoned");
    payload.action = "milestoned";
    payload.issue.milestone!.title = "Backlog";

    mockAPI.graphql.mockResolvedValue(getRelatedPRMock());

    await addMilestoneLabelsToRelatedPRs(api, payload, getFakeLogger());

    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: 1234,
      labels: ["For Backlog Bug"],
    });
  });

  it("Adds 'Fix Available' label to the issue if appropriate", async () => {
    const { mockAPI, api } = createMockGitHubClient();
    const payload: IssuesEvent = getIssueFixture("milestoned");
    payload.action = "milestoned";
    payload.issue.milestone!.title = "TypeScript 5.8.0";
    payload.issue.labels = [];

    mockAPI.graphql.mockResolvedValue(getRelatedPRMock());

    await addMilestoneLabelsToRelatedPRs(api, payload, getFakeLogger());

    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.issue.number,
      labels: ["Fix Available"],
    });
  });

  it("Skips when no new labels need to be added", async () => {
    const { mockAPI, api } = createMockGitHubClient();
    const payload: IssuesEvent = getIssueFixture("milestoned");
    payload.action = "milestoned";
    payload.issue.milestone!.title = "Backlog";

    mockAPI.graphql.mockResolvedValue(getRelatedPRMock(["For Backlog Bug"]));

    await addMilestoneLabelsToRelatedPRs(api, payload, getFakeLogger());

    expect(mockAPI.issues.removeLabel).not.toHaveBeenCalled();
    expect(mockAPI.issues.addLabels).not.toHaveBeenCalled();
  });
});

import { assignSelfToNewPullRequest } from "./assignSelfToNewPullRequest";
import { createMockGitHubClient, convertToOctokitAPI, getPRFixture } from "../util/tests/createMockGitHubClient";
import { getFakeLogger } from "../util/tests/createMockContext";

describe(assignSelfToNewPullRequest, () => {
  it("NO-OPs when there's assignees already ", async () => {
    const mockAPI = createMockGitHubClient();
    const pr = getPRFixture("opened")
    pr.pull_request.assignees = ["orta"]

    const api = convertToOctokitAPI(mockAPI);
    await assignSelfToNewPullRequest(api, pr, getFakeLogger());

    expect(mockAPI.repos.checkCollaborator).not.toHaveBeenCalled();
    expect(mockAPI.issues.addAssignees).not.toHaveBeenCalledWith();
  });


  it("Sets the assignee when they have write access ", async () => {
    const mockAPI = createMockGitHubClient();
    mockAPI.teams.getByName.mockResolvedValue({ data: { id: 123456 } });
    mockAPI.teams.getMembership.mockResolvedValue({ status: 200 });
    mockAPI.issues.addAssignees.mockResolvedValue({});

    const api = convertToOctokitAPI(mockAPI);
    await assignSelfToNewPullRequest(api, getPRFixture("opened"), getFakeLogger());

    expect(mockAPI.teams.getMembership).toHaveBeenCalled();
    expect(mockAPI.issues.addAssignees).toHaveBeenCalledWith({
      assignees: ["ahejlsberg"],
      id: 35454,
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript"
    });
  });

  it("Does not set the assignment when they have read access", async () => {
    const mockAPI = createMockGitHubClient();
    mockAPI.teams.getByName.mockResolvedValue({ data: { id: 123456 } });
    mockAPI.teams.getMembership.mockRejectedValue(new Error(""));
    mockAPI.issues.addAssignees.mockResolvedValue({});

    const api = convertToOctokitAPI(mockAPI);
    await assignSelfToNewPullRequest(api, getPRFixture("opened"), getFakeLogger());

    expect(mockAPI.teams.getMembership).toHaveBeenCalled();
    expect(mockAPI.issues.addAssignees).not.toHaveBeenCalled();
  });
});

import { addLabelForTeamMember } from "./addLabelForTeamMember";
import { createMockGitHubClient, convertToOctokitAPI, getPRFixture } from "../util/tests/createMockGitHubClient";

describe(addLabelForTeamMember, () => {
  it("Adds the label when a team member writes a PR ", async () => {
    const mockAPI = createMockGitHubClient();
    mockAPI.teams.getByName.mockResolvedValue({ data: { id: 123456 } });
    mockAPI.teams.getMembership.mockResolvedValue({ status: 200 });

    const api = convertToOctokitAPI(mockAPI);
    await addLabelForTeamMember(api, getPRFixture("opened"));

    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      issue_number: 348031538,
      labels: ["Author: Team"],
      owner: "microsoft",
      repo: "TypeScript"
    });
  });

  it("Does not set the assignment when they have read access", async () => {
    const mockAPI = createMockGitHubClient();
    mockAPI.teams.getByName.mockResolvedValue({ data: { id: 123456 } });
    mockAPI.teams.getMembership.mockResolvedValue({ status: 200 });
    mockAPI.issues.addAssignees.mockResolvedValue({});
    const api = convertToOctokitAPI(mockAPI);
    await addLabelForTeamMember(api, getPRFixture("opened"));
    expect(mockAPI.teams.getMembership).toHaveBeenCalled();
    expect(mockAPI.issues.addAssignees).not.toHaveBeenCalled();
  });
});

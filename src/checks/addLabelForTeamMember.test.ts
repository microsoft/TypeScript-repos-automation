jest.mock("../pr_meta/isMemberOfTSTeam")

import { addLabelForTeamMember } from "./addLabelForTeamMember";
import { createMockGitHubClient, convertToOctokitAPI, getPRFixture } from "../util/tests/createMockGitHubClient";
import { getFakeLogger } from "../util/tests/createMockContext";

import {isMemberOfTSTeam} from "../pr_meta/isMemberOfTSTeam"
const mockIsMember = isMemberOfTSTeam as any as jest.Mock

describe(addLabelForTeamMember, () => {
  it("Adds the label when a team member writes a PR ", async () => {
    const mockAPI = createMockGitHubClient();
    mockIsMember.mockResolvedValue(true)

    const api = convertToOctokitAPI(mockAPI);
    await addLabelForTeamMember(api, getPRFixture("opened"), getFakeLogger());

    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      issue_number: 348031538,
      labels: ["Author: Team"],
      owner: "microsoft",
      repo: "TypeScript"
    });
  });

  it("Does not set the assignment when they are not a team member", async () => {
    const mockAPI = createMockGitHubClient();
    mockIsMember.mockResolvedValue(false)
    mockAPI.issues.addAssignees.mockResolvedValue({});
    
    const api = convertToOctokitAPI(mockAPI);
    await addLabelForTeamMember(api, getPRFixture("opened"), getFakeLogger());

    expect(mockAPI.issues.addAssignees).not.toHaveBeenCalled();
  });
});

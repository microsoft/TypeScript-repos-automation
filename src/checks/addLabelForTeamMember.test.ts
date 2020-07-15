jest.mock("../pr_meta/isMemberOfTSTeam")

import { addLabelForTeamMember } from "./addLabelForTeamMember"
import { createMockGitHubClient, convertToOctokitAPI, getPRFixture } from "../util/tests/createMockGitHubClient"
import { getFakeLogger } from "../util/tests/createMockContext"

import { isMemberOfTSTeam } from "../pr_meta/isMemberOfTSTeam"
const mockIsMember = (isMemberOfTSTeam as any) as jest.Mock

describe(addLabelForTeamMember, () => {
  it("Adds the label when a team member writes a PR ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockIsMember.mockResolvedValue(true)

    await addLabelForTeamMember(api, getPRFixture("opened"), getFakeLogger())

    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      issue_number: 35454,
      labels: ["Author: Team"],
      owner: "microsoft",
      repo: "TypeScript",
    })
  })

  it("Does not set the assignment when they are not a team member", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockIsMember.mockResolvedValue(false)
    mockAPI.issues.addAssignees.mockResolvedValue({})

    await addLabelForTeamMember(api, getPRFixture("opened"), getFakeLogger())

    expect(mockAPI.issues.addAssignees).not.toHaveBeenCalled()
  })
})

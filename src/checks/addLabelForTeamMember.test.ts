jest.mock("../pr_meta/isMemberOfTSTeam")

import { addLabelForTeamMember } from "./addLabelForTeamMember"
import { createMockGitHubClient, getPRFixture } from "../util/tests/createMockGitHubClient"
import { getFakeLogger } from "../util/tests/createMockContext"

import { createPRInfo } from "../util/tests/createPRInfo"

describe(addLabelForTeamMember, () => {
  it("Adds the label when a team member writes a PR ", async () => {
    const { mockAPI, api } = createMockGitHubClient()

    const info = createPRInfo({ authorIsMemberOfTSTeam: true })
    await addLabelForTeamMember(api, getPRFixture("opened"), getFakeLogger(), info)

    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      issue_number: 35454,
      labels: ["Author: Team"],
      owner: "microsoft",
      repo: "TypeScript",
    })
  })

  it("Does not set the assignment when they are not a team member", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    mockAPI.issues.addAssignees.mockResolvedValue({})

    const info = createPRInfo({ authorIsMemberOfTSTeam: false })
    await addLabelForTeamMember(api, getPRFixture("opened"), getFakeLogger(), info)

    expect(mockAPI.issues.addAssignees).not.toHaveBeenCalled()
  })
})

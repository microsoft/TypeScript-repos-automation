import { beforeEach, describe, expect, it, vi } from "vitest"
import { handleIssuePayload } from "../anyRepoHandleIssue.js"
import { handlePullRequestPayload } from "../anyRepoHandlePullRequest.js"
import { createGitHubClient } from "../util/createGitHubClient.js"
import { createMockContext } from "../util/tests/createMockContext.js"
import { createMockGitHubClient, getIssueFixture, getPRFixture } from "../util/tests/createMockGitHubClient.js"
import { generatedDomLibFiles } from "../checks/closeGeneratedDomLibPRs.js"

vi.mock("../util/createGitHubClient.js")

const mockCreateGitHubClient = vi.mocked(createGitHubClient)

beforeEach(() => {
  vi.clearAllMocks()
})

describe(handlePullRequestPayload, () => {
  describe.each([
    { name: "team-authored fork", source: "fork", member: true, bot: false, isTeamPR: true },
    { name: "non-team same-repository PR", source: "same", member: false, bot: false, isTeamPR: true },
    { name: "agent same-repository PR", source: "same", member: false, bot: true, isTeamPR: true },
    { name: "external fork", source: "fork", member: false, bot: false, isTeamPR: false },
    { name: "bot fork", source: "fork", member: false, bot: true, isTeamPR: false },
    { name: "deleted external fork", source: "deleted", member: false, bot: false, isTeamPR: false },
  ])("$name", ({ source, member, bot, isTeamPR }) => {
    it.each([false, true])("labels and exempts team PRs (modifies DOM libraries: %s)", async modifiesDom => {
      const { mockAPI, api } = createMockGitHubClient()
      mockCreateGitHubClient.mockResolvedValue(api)
      mockAPI.teams.getMembershipForUserInOrg.mockResolvedValue({
        data: { state: member ? "active" : "pending" },
      })
      mockAPI.graphql.mockResolvedValue({
        repository: {
          pullRequest: {
            closingIssuesReferences: {
              nodes: [],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      })
      mockAPI.paginate.mockResolvedValue([])
      if (modifiesDom) {
        mockAPI.paginate
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([{ filename: generatedDomLibFiles[0] }])
      }

      const payload = getPRFixture("opened")
      payload.pull_request.user.login = bot ? "agent[bot]" : "contributor"
      payload.pull_request.user.type = bot ? "Bot" : "User"
      payload.pull_request.assignees = []
      payload.pull_request.draft = false
      payload.pull_request.head.repo = source === "deleted" ? null : {
        ...payload.pull_request.base.repo,
        id: payload.pull_request.base.repo.id + (source === "fork" ? 1 : 0),
      }

      const response = await handlePullRequestPayload(payload, createMockContext())

      expect(response.status).toBe(200)
      if (isTeamPR) {
        expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
          owner: "microsoft",
          repo: "TypeScript",
          issue_number: payload.number,
          labels: ["Author: Team"],
        })
      } else {
        expect(mockAPI.issues.addLabels).not.toHaveBeenCalledWith(
          expect.objectContaining({ labels: ["Author: Team"] }),
        )
      }
      if (isTeamPR || bot) {
        expect(mockAPI.paginate).toHaveBeenCalledTimes(1)
        expect(mockAPI.issues.createComment).not.toHaveBeenCalled()
        expect(mockAPI.pulls.update).not.toHaveBeenCalled()
      } else {
        expect(mockAPI.issues.createComment).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.stringContaining(modifiesDom ? "TypeScript-DOM-lib-generator" : "doesn't have any linked issues"),
          }),
        )
        if (modifiesDom) {
          expect(mockAPI.pulls.update).toHaveBeenCalledWith(
            expect.objectContaining({ state: "closed" }),
          )
        } else {
          expect(mockAPI.pulls.update).not.toHaveBeenCalled()
        }
      }
      if (member) {
        expect(mockAPI.issues.addAssignees).toHaveBeenCalledWith(
          expect.objectContaining({ assignees: ["contributor"] }),
        )
      } else {
        expect(mockAPI.issues.addAssignees).not.toHaveBeenCalled()
      }
    })
  })

  it("does not authenticate for closed pull requests", async () => {
    const response = await handlePullRequestPayload(getPRFixture("closed"), createMockContext())

    expect(response.body).toBe("Success, NOOP")
    expect(mockCreateGitHubClient).not.toHaveBeenCalled()
  })

  it("does not authenticate for another owner's TypeScript repository", async () => {
    const payload = getPRFixture("opened")
    payload.repository.owner.login = "other"

    const response = await handlePullRequestPayload(payload, createMockContext())

    expect(response.body).toBe("Success, NOOP")
    expect(mockCreateGitHubClient).not.toHaveBeenCalled()
  })
})

describe(handleIssuePayload, () => {
  it("does not authenticate for another owner's TypeScript repository", async () => {
    const payload = getIssueFixture("milestoned")
    payload.repository.owner.login = "other"

    const response = await handleIssuePayload(payload, createMockContext())

    expect(response.body).toBe("Success, NOOP")
    expect(mockCreateGitHubClient).not.toHaveBeenCalled()
  })
})

jest.mock("../pr_meta/isMemberOfTSTeam")
jest.mock("./pingDiscordForReproRequests")


import { createMockGitHubClient, getIssueFixture, getIssueCommentFixture } from "../util/tests/createMockGitHubClient"
import { getFakeLogger } from "../util/tests/createMockContext"

import { addReprosLabelOnComments, addReprosLabelOnIssue } from "./addReprosLabel"
import {pingDiscord} from "./pingDiscordForReproRequests"


describe(addReprosLabelOnIssue, () => {
  it("NO-OPs when the action isn't opened or edited ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getIssueFixture("opened")
    payload.action = "closed"

    await addReprosLabelOnIssue(api, payload, getFakeLogger())

    expect(mockAPI.issues.addLabels).not.toHaveBeenCalled()
    expect(pingDiscord).not.toHaveBeenCalled()
  })

  it("Adds the label when it has a repro in the body ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getIssueFixture("opened")
    payload.issue.body = "```ts repro"

    await addReprosLabelOnIssue(api, payload, getFakeLogger())

    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      labels: ["Has Repro"],
      issue_number: 35451,
      owner: "microsoft",
      repo: "TypeScript",
    })

    expect(pingDiscord).toHaveBeenCalled()
  })


  it("NOOPs when there isn't a repro in the body ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getIssueFixture("opened")
    payload.issue.body = ""

    await addReprosLabelOnIssue(api, payload, getFakeLogger())

    expect(mockAPI.issues.addLabels).not.toHaveBeenCalledWith()
  })
})


describe(addReprosLabelOnComments, () => {
  it("NO-OPs when the action isn't opened or edited ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getIssueCommentFixture("created")
    payload.action = "closed"

    await addReprosLabelOnComments(api, payload, getFakeLogger())

    expect(mockAPI.issues.addLabels).not.toHaveBeenCalledWith()
  })

  it("Adds the label when it has a repro in the body ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getIssueCommentFixture("created")
    payload.comment.body = "```ts repro"

    await addReprosLabelOnComments(api, payload, getFakeLogger())

    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      labels: ["Has Repro"],
      issue_number: 696,
      owner: "microsoft",
      repo: "TypeScript-Website",
    })
    expect(pingDiscord).toHaveBeenCalled()
  })

  it("NOOPs when there isn't a repro in the body ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getIssueCommentFixture("created")
    payload.comment.body = ""

    await addReprosLabelOnComments(api, payload, getFakeLogger())

    expect(mockAPI.issues.addLabels).not.toHaveBeenCalledWith()
  })
})

jest.mock("../pr_meta/isMemberOfTSTeam")

import { createMockGitHubClient, getIssueFixture, getIssueCommentFixture } from "../util/tests/createMockGitHubClient"
import { getFakeLogger } from "../util/tests/createMockContext"

import { addOrRemoveReprosLabelOnComments, addOrRemoveReprosLabelOnIssue } from "./addOrRemoveReprosLabel"


describe(addOrRemoveReprosLabelOnIssue, () => {
  it("NO-OPs when the action isn't opened or edited ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getIssueFixture("opened")
    payload.action = "closed"

    await addOrRemoveReprosLabelOnIssue(api, payload, getFakeLogger())

    expect(mockAPI.issues.addLabels).not.toHaveBeenCalledWith()
  })

  it("Adds the label when it has a repro in the body ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getIssueFixture("opened")
    payload.issue.body = "```ts repro"

    await addOrRemoveReprosLabelOnIssue(api, payload, getFakeLogger())

    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      labels: ["Has Repro"],
      issue_number: 35451,
      owner: "microsoft",
      repo: "TypeScript",
    })
  })


  it("NOOPs when there isn't a repro in the body ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getIssueFixture("opened")
    payload.issue.body = ""

    await addOrRemoveReprosLabelOnIssue(api, payload, getFakeLogger())

    expect(mockAPI.issues.addLabels).not.toHaveBeenCalledWith()
  })
})


describe(addOrRemoveReprosLabelOnComments, () => {
  it("NO-OPs when the action isn't opened or edited ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getIssueCommentFixture("created")
    payload.action = "closed"

    await addOrRemoveReprosLabelOnComments(api, payload, getFakeLogger())

    expect(mockAPI.issues.addLabels).not.toHaveBeenCalledWith()
  })

  it("Adds the label when it has a repro in the body ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getIssueCommentFixture("created")
    payload.comment.body = "```ts repro"

    await addOrRemoveReprosLabelOnComments(api, payload, getFakeLogger())

    expect(mockAPI.issues.addLabels).toHaveBeenCalledWith({
      labels: ["Has Repro"],
      issue_number: 696,
      owner: "microsoft",
      repo: "TypeScript-Website",
    })
  })

  it("NOOPs when there isn't a repro in the body ", async () => {
    const { mockAPI, api } = createMockGitHubClient()
    const payload = getIssueCommentFixture("created")
    payload.comment.body = ""

    await addOrRemoveReprosLabelOnComments(api, payload, getFakeLogger())

    expect(mockAPI.issues.addLabels).not.toHaveBeenCalledWith()
  })
})

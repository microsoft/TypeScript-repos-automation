jest.mock("../anyRepoHandlePullRequest", () => ({ handlePullRequestPayload: jest.fn() }))
jest.mock("../anyRepoHandleStatusUpdate", () => ({ anyRepoHandleStatusUpdate: jest.fn() }))
jest.mock("../anyRepoHandleIssueComment", () => ({ anyRepoHandleIssueCommentPayload: jest.fn() }))
jest.mock("../anyRepoHandleIssue", () => ({ handleIssuePayload: jest.fn() }))

import webhook from "../../functions/TypeScriptRepoPullRequestWebhook"
import { handlePullRequestPayload } from "../anyRepoHandlePullRequest"
import { anyRepoHandleIssueCommentPayload } from "../anyRepoHandleIssueComment"
import { HttpRequest, InvocationContext } from "@azure/functions"

it("calls handle PR from the webhook main", async () => {
  process.env.AZURE_FUNCTIONS_ENVIRONMENT = "Development"
  await webhook(new HttpRequest({ method: "POST", url: "https://example.org", body: { string: "{}" }, headers: { "x-github-event": "pull_request" } }), new InvocationContext({ logHandler: () => "" }))

  expect(handlePullRequestPayload).toHaveBeenCalled()
})

it("calls handle comments from the webhook main", async () => {
  process.env.AZURE_FUNCTIONS_ENVIRONMENT = "Development"
  await webhook(new HttpRequest({ method: "POST", url: "https://example.org", body: { string: "{}" }, headers: { "x-github-event": "issue_comment" } }), new InvocationContext({ logHandler: () => "" }))

  expect(anyRepoHandleIssueCommentPayload).toHaveBeenCalled()
})

// it("calls handle issues from the webhook main", () => {
//   process.env.AZURE_FUNCTIONS_ENVIRONMENT = "Development"
//   webhook({ log: { info: () => "" } } as any, { body: "{}", headers: { "x-github-event": "issue" } })

//   expect(handleIssuePayload).toHaveBeenCalled()
// })

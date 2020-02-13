jest.mock("../typeScriptHandlePullRequest", () => ({ handlePullRequestPayload: jest.fn() }))
jest.mock("../anyRepoHandleStatusUpdate", () => ({ anyRepoHandleStatusUpdate: jest.fn() }))
jest.mock("../anyRepoHandleIssueComment", () => ({ anyRepoHandleIssueCommentPayload: jest.fn() }))

import webhook from "../../TypeScriptRepoPullRequestWebhook/index"
import { handlePullRequestPayload } from "../typeScriptHandlePullRequest"
import { anyRepoHandleStatusUpdate } from "../anyRepoHandleStatusUpdate"
import { anyRepoHandleIssueCommentPayload } from "../anyRepoHandleIssueComment"

it("calls handle PR from the webhook main", () => {
  process.env.AZURE_FUNCTIONS_ENVIRONMENT = "Development"
  webhook({ log: { info: () => "" }} as any, { body: "{}", headers: { "x-github-event": "pull_request" }})

  expect(handlePullRequestPayload).toHaveBeenCalled()
})

it("calls handle status from the webhook main", () => {
  process.env.AZURE_FUNCTIONS_ENVIRONMENT = "Development"
  webhook({ log: { info: () => "" }} as any, { body: "{}", headers: { "x-github-event": "status" }})

  expect(anyRepoHandleStatusUpdate).toHaveBeenCalled()
})

it("calls handle cmments from the webhook main", () => {
  process.env.AZURE_FUNCTIONS_ENVIRONMENT = "Development"
  webhook({ log: { info: () => "" }} as any, { body: "{}", headers: { "x-github-event": "issue_comment" }})

  expect(anyRepoHandleIssueCommentPayload).toHaveBeenCalled()
})

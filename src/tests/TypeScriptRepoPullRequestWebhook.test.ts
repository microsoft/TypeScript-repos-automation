jest.mock("../anyRepoHandlePullRequest", () => ({ handlePullRequestPayload: jest.fn() }))
jest.mock("../anyRepoHandleStatusUpdate", () => ({ anyRepoHandleStatusUpdate: jest.fn() }))
jest.mock("../anyRepoHandleIssueComment", () => ({ anyRepoHandleIssueCommentPayload: jest.fn() }))
jest.mock("../anyRepoHandleIssue", () => ({ handleIssuePayload: jest.fn() }))

import webhook from "../../TypeScriptRepoPullRequestWebhook/index"
import { handlePullRequestPayload } from "../anyRepoHandlePullRequest"
import { anyRepoHandleStatusUpdate } from "../anyRepoHandleStatusUpdate"
import { anyRepoHandleIssueCommentPayload } from "../anyRepoHandleIssueComment"
import { handleIssuePayload } from "../anyRepoHandleIssue"

it("calls handle PR from the webhook main", () => {
  process.env.AZURE_FUNCTIONS_ENVIRONMENT = "Development"
  webhook({ log: { info: () => "" } } as any, { body: "{}", headers: { "x-github-event": "pull_request" } })

  expect(handlePullRequestPayload).toHaveBeenCalled()
})

it("calls handle status from the webhook main", () => {
  process.env.AZURE_FUNCTIONS_ENVIRONMENT = "Development"
  webhook({ log: { info: () => "" } } as any, { body: "{}", headers: { "x-github-event": "status" } })

  expect(anyRepoHandleStatusUpdate).toHaveBeenCalled()
})

it("calls handle comments from the webhook main", () => {
  process.env.AZURE_FUNCTIONS_ENVIRONMENT = "Development"
  webhook({ log: { info: () => "" } } as any, { body: "{}", headers: { "x-github-event": "issue_comment" } })

  expect(anyRepoHandleIssueCommentPayload).toHaveBeenCalled()
})

// it("calls handle issues from the webhook main", () => {
//   process.env.AZURE_FUNCTIONS_ENVIRONMENT = "Development"
//   webhook({ log: { info: () => "" } } as any, { body: "{}", headers: { "x-github-event": "issue" } })

//   expect(handleIssuePayload).toHaveBeenCalled()
// })

jest.mock("../typeScriptHandlePullRequest", () => ({ handlePullRequestPayload: jest.fn() }))
jest.mock("../anyRepoHandleStatusUpdate", () => ({ anyRepoHandleStatusUpdate: jest.fn() }))

import webhook from "../../TypeScriptRepoPullRequestWebhook/index"
import { handlePullRequestPayload } from "../typeScriptHandlePullRequest"
import { anyRepoHandleStatusUpdate } from "../anyRepoHandleStatusUpdate"

it("calls handle PR from the webhook main", () => {
  process.env.AZURE_FUNCTIONS_ENVIRONMENT = "Development"
  webhook({ log: { info: () => "" }} as any, { body: "{}", headers: { "X-GitHub-Event": "pull_request" }})

  expect(handlePullRequestPayload).toHaveBeenCalled()
})

it("calls handle status from the webhook main", () => {
  process.env.AZURE_FUNCTIONS_ENVIRONMENT = "Development"
  webhook({ log: { info: () => "" }} as any, { body: "{}", headers: { "X-GitHub-Event": "status" }})

  expect(anyRepoHandleStatusUpdate).toHaveBeenCalled()
})

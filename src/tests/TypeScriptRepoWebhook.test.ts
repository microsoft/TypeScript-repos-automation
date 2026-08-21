import { beforeEach, vi, it, expect } from "vitest"
vi.mock("../anyRepoHandlePullRequest.js", () => ({ handlePullRequestPayload: vi.fn() }))
vi.mock("../anyRepoHandleIssue.js", () => ({ handleIssuePayload: vi.fn() }))

import webhook from "../functions/TypeScriptRepoWebhook.js"
import { handlePullRequestPayload } from "../anyRepoHandlePullRequest.js"
import { handleIssuePayload } from "../anyRepoHandleIssue.js"
import { HttpRequest, InvocationContext } from "@azure/functions"

beforeEach(() => {
  vi.clearAllMocks()
  process.env.AZURE_FUNCTIONS_ENVIRONMENT = "Development"
})

it("calls handle PR from the webhook main", async () => {
  await webhook(new HttpRequest({ method: "POST", url: "https://example.org", body: { string: "{}" }, headers: { "x-github-event": "pull_request" } }), new InvocationContext({ logHandler: () => "" }))

  expect(handlePullRequestPayload).toHaveBeenCalled()
  expect(handleIssuePayload).not.toHaveBeenCalled()
})

it("calls handle issues from the webhook main", async () => {
  await webhook(new HttpRequest({ method: "POST", url: "https://example.org", body: { string: "{}" }, headers: { "x-github-event": "issues" } }), new InvocationContext({ logHandler: () => "" }))

  expect(handleIssuePayload).toHaveBeenCalled()
  expect(handlePullRequestPayload).not.toHaveBeenCalled()
})

import { beforeEach, vi, it, expect } from "vitest"
vi.mock("../anyRepoHandlePullRequest.js", () => ({ handlePullRequestPayload: vi.fn() }))
vi.mock("../anyRepoHandleIssue.js", () => ({ handleIssuePayload: vi.fn() }))

import webhook from "../functions/TypeScriptRepoWebhook.js"
import { handlePullRequestPayload } from "../anyRepoHandlePullRequest.js"
import { handleIssuePayload } from "../anyRepoHandleIssue.js"
import { HttpRequest, InvocationContext } from "@azure/functions"
import { sign } from "@octokit/webhooks-methods"

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

it("rejects webhooks with an invalid signature", async () => {
  process.env.AZURE_FUNCTIONS_ENVIRONMENT = "Production"
  process.env.GITHUB_WEBHOOK_SECRET = "secret"
  const signature = await sign("wrong", "{}")

  const response = await webhook(new HttpRequest({ method: "POST", url: "https://example.org", body: { string: "{}" }, headers: { "x-github-event": "pull_request", "x-hub-signature-256": signature } }), new InvocationContext({ logHandler: () => "" }))

  expect(response).toMatchObject({ status: 500 })
  expect(handlePullRequestPayload).not.toHaveBeenCalled()
})

it("accepts webhooks with a valid signature", async () => {
  process.env.AZURE_FUNCTIONS_ENVIRONMENT = "Production"
  process.env.GITHUB_WEBHOOK_SECRET = "secret"
  const signature = await sign("secret", "{}")

  await webhook(new HttpRequest({ method: "POST", url: "https://example.org", body: { string: "{}" }, headers: { "x-github-event": "pull_request", "x-hub-signature-256": signature } }), new InvocationContext({ logHandler: () => "" }))

  expect(handlePullRequestPayload).toHaveBeenCalled()
})

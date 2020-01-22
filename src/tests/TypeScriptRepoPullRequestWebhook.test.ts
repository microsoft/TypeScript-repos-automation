jest.mock("../typeScriptHandlePullRequest", () => ({ handlePullRequestPayload: jest.fn() }))
import webhook from "../../TypeScriptRepoPullRequestWebhook/index"
import { handlePullRequestPayload } from "../typeScriptHandlePullRequest"

it("calls handle PR from the webhook main", () => {
  process.env.AZURE_FUNCTIONS_ENVIRONMENT = "Development"
  webhook({} as any, { body: "{}"})

  expect(handlePullRequestPayload).toHaveBeenCalled()
})

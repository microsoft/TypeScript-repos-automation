jest.mock("../typeScriptHandleIssue.ts", () => ({ handleIssuePayload: jest.fn() }))
import webhook from "../../TypeScriptRepoIssueWebhook/index"
import { handleIssuePayload } from "../typeScriptHandleIssue"

it("calls handle PR from the webhook main", () => {
  process.env.AZURE_FUNCTIONS_ENVIRONMENT = "Development"
  webhook({} as any, { body: "{}" })

  expect(handleIssuePayload).toHaveBeenCalled()
})

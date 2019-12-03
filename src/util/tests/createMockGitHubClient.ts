import Octokit = require("@octokit/rest")
import {readFileSync} from "fs"
import {join} from "path"
import { WebhookPayloadPullRequest, WebhookPayloadIssues } from "@octokit/webhooks"

/**
 * Creates a version of the GitHub API client where API calls
 * are fully mocked out and you have total control over the response APIs. This 
 * object should always contain a jest.fn for every API call the app makes 
 * over time.
 * 
 * @example
 * 
 *   const mockAPI = createMockGitHubClient();
 *   mockAPI.repos.checkCollaborator.mockResolvedValue({ data: { permission: "write" } });
 *   mockAPI.issues.addAssignees.mockResolvedValue({});
 * 
 *   // Then run it through convertToOctokitAPI to use in functions
 * 
 *   const api = convertToOctokitAPI(mockAPI)
 */
export const createMockGitHubClient = () => {
  return {
    repos: {
      checkCollaborator: jest.fn()
    },
    issues: {
      addAssignees: jest.fn()
    }
  }
}

/** 
 * Assertion functions don't work when the param type is inferred,
 * so it's either set a variable like this in each test, or we hardcode
 * the return type for createMockGitHubClient. I think this is probably 
 * the better option.
 */
export const convertToOctokitAPI = (mock: {}) => {
  return mock as unknown as Octokit
}

/** Grabs a known PR fixture */
export const getPRFixture = (fixture: "closed" | "opened") : WebhookPayloadPullRequest => 
  JSON.parse(readFileSync(join(__dirname, "..", "..", "..", "fixtures", "pulls", fixture + ".json"), "utf8"))


  /** Grabs a known issue fixture */
export const getIssueFixture = (fixture: "created" | "labeled") : WebhookPayloadIssues => 
JSON.parse(readFileSync(join(__dirname, "..", "..", "..", "fixtures", "issues", fixture + ".json"), "utf8"))


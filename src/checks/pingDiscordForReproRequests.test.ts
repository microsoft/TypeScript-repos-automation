jest.mock("node-fetch")
import { createMockGitHubClient, getIssueFixture, getPRFixture } from "../util/tests/createMockGitHubClient"
import { getFakeLogger } from "../util/tests/createMockContext"

import { mergeThroughCodeOwners, mergePhrase } from "./mergeThroughCodeOwners"
import { getContents } from "../util/getContents"
import { pingDiscordForReproRequests } from "./pingDiscordForReproRequests"
import fetch from "node-fetch"

const genericWebhook = {
  comment: {
    body: mergePhrase,
    user: {
      login: "orta",
    },
  },
  issue: {
    number: 1234,
  },
  repository: {
    owner: {
      login: "microsoft",
    },
    name: "TypeScript-Website",
  },
}

describe("pinging discord for new repro requests", () => {
  it("NOOPs on labels which aren't right", async () => {
    const { api } = createMockGitHubClient()
    const payload = getIssueFixture("labeled")

    await pingDiscordForReproRequests(api, payload, getFakeLogger())

    expect(fetch).not.toHaveBeenCalled()
  })

  it("Keeps existing labels from the PR", async () => {
    const { mockAPI, api } = createMockGitHubClient()

    const payload = getIssueFixture("labeled")
    // @ts-ignore
    payload.label = { name: "Repro Requested" }

    process.env.REPRO_REQUEST_DISCORD_WEBHOOK = "12345"
    await pingDiscordForReproRequests(api, payload, getFakeLogger())

    expect(fetch).toHaveBeenCalledWith("12345", {
      body:
        '{"content":"Repro requested on #35430","embeds":[{"title":"Suggestions for variable like name from type name","description":"\\r\\n```ts\\r\\nconst us/*here*/ : UserService\\r\\n// us -> userService\\r\\n```\\r\\n\\r\\n\\r\\n## Examples\\r\\n\\r\\n\\r\\n\\r\\n","url":"https://github.com/microsoft/TypeScript/issues/35430"}]}',
      method: "POST",
    })
  })
})

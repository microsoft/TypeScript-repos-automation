import { describe, expect, it } from "vitest"
import { isCopilot, isTypeScriptBot } from "./botUsers.js"

describe(isTypeScriptBot, () => {
  it("recognizes Copilot as a bot", () => {
    expect(isTypeScriptBot("Copilot")).toBe(true)
  })
})

describe(isCopilot, () => {
  it.each(["Copilot", "copilot", "COPILOT"])("recognizes %s", login => {
    expect(isCopilot(login)).toBe(true)
  })

  it("rejects missing and other logins", () => {
    expect(isCopilot(undefined)).toBe(false)
    expect(isCopilot("octocat")).toBe(false)
  })
})

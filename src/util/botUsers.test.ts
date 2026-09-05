import { describe, expect, it } from "vitest"
import { isTypeScriptBot } from "./botUsers.js"

describe(isTypeScriptBot, () => {
  it("recognizes Copilot as a bot", () => {
    expect(isTypeScriptBot("Copilot")).toBe(true)
  })
})

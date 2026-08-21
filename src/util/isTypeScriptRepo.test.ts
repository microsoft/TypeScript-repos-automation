import { describe, expect, it } from "vitest"
import { isTypeScriptRepo } from "./isTypeScriptRepo.js"

describe(isTypeScriptRepo, () => {
  it("matches the Microsoft TypeScript repository", () => {
    expect(isTypeScriptRepo("microsoft", "TypeScript")).toBe(true)
  })

  it("does not match another owner's TypeScript repository", () => {
    expect(isTypeScriptRepo("example", "TypeScript")).toBe(false)
  })

  it("does not match another Microsoft repository", () => {
    expect(isTypeScriptRepo("microsoft", "DefinitelyTyped")).toBe(false)
  })
})

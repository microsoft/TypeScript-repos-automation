import { findIssuesInBody, constrainIssuesToBaseRepo } from "./getRelatedIssues"

it("pulls out issues", () => {
  const body = `
bunch of body text closes #1 sure thing
 closes: #2
fix Microsoft/TypeScript#3
 closes: Microsoft/TypeScript#4 ok then

 Fixes: #5
fixes https://github.com/microsoft/TypeScript/issues/6
`

  const result = findIssuesInBody(body)
  expect(result).toMatchInlineSnapshot(`
    Array [
      "#1",
      "#2",
      "microsoft/typescript#4",
      "microsoft/typescript#3",
      "#5",
      "https://github.com/microsoft/typescript/issues/6",
    ]
  `)
})

it("pulls out issues", () => {
  const body = `
resolve #1
fix Microsoft/TypeScript#3
 closes: orta/TypeScript#4 ok then
fixes https://github.com/microsoft/TypeScript/issues/6
`

  const allResults = findIssuesInBody(body)
  const constrainedResults = constrainIssuesToBaseRepo(allResults, "MiCrOSoFT/TypeScript")
  expect(constrainedResults).toMatchInlineSnapshot(`
    Array [
      "3",
      "6",
      "1",
    ]
  `)
})

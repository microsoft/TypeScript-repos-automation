import { getFilesNotOwnedByCodeOwner, getCodeOwnersInfo } from "./hasAccessToMergePR"

it("matches simple files", () => {
  const codeOwnersText = `
/a/b @orta
`
  const files = ["/a/b"]

  const result = getFilesNotOwnedByCodeOwner("orta", files, getCodeOwnersInfo(codeOwnersText))
  expect(result).toEqual([])
})

it("matches simple files", () => {
  const codeOwnersText = `
/a/b/c/* @orta
/a/b/d/* @orta
/b/c @hayes
`
  const files = ["/a/b", "/a/b/c/deff", "/b/c"]

  const result = getFilesNotOwnedByCodeOwner("orta", files, getCodeOwnersInfo(codeOwnersText))
  expect(result).toEqual(["/a/b", "/b/c"])
})

it("matches simple files", () => {
  const codeOwnersText = `
/packages/**/ja/** @hayes
/a/b/d/* @orta
/b/c @hayes
`
  const files = ["/packages/playground-examples/copy/ja/TypeScript/Type Primitives/Built-in Utility Types.ts ", "/b/c"]

  const result = getFilesNotOwnedByCodeOwner("hayes", files, getCodeOwnersInfo(codeOwnersText))
  expect(result).toEqual([])
})

it("matches real life files", () => {
  const codeOwnersText = `
/packages/playground-examples/copy/ja/** @sasurau4 @Quramy @Naturalclar @Takepepe @orta
/packages/tsconfig-reference/copy/ja/** @sasurau4 @Quramy @Naturalclar @Takepepe @orta
/packages/typescriptlang-org/src/copy/ja/** @sasurau4 @Quramy @Naturalclar @Takepepe @orta
`
  const files = ["/packages/playground-examples/copy/ja/TypeScript/Type Primitives/Built-in Utility Types.ts ", "/b/c"]

  const result = getFilesNotOwnedByCodeOwner("orta", files, getCodeOwnersInfo(codeOwnersText))
  expect(result).toEqual(["/b/c"])
})

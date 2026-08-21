export const isTypeScriptRepo = (owner: string, repo: string) =>
  owner.toLowerCase() === "microsoft" && repo.toLowerCase() === "typescript"

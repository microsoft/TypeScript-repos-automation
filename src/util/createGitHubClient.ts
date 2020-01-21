import * as Octokit from "@octokit/rest"

const inProductionish = typeof jest !== "undefined"
if (!inProductionish) {
  if (!process.env.GITHUB_TOKEN ?? !process.env.GITHUB_API_TOKEN) throw new Error("There isn't a GITHUB_API_TOKEN in your env")
}

export const createGitHubClient = () => 
   new Octokit({ auth:process.env.GITHUB_TOKEN ?? process.env.GITHUB_API_TOKEN ?? "example-token" })


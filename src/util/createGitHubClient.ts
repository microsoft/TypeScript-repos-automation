import * as Octokit from "@octokit/rest"

const inJest = typeof jest !== "undefined"
if (!inJest && !process.env.GITHUB_API_TOKEN) {
  throw new Error("There isn't a GITHUB_API_TOKEN in your env")
}

export const createGitHubClient = () => 
   new Octokit({ auth: process.env.GITHUB_API_TOKEN || "example-token" })


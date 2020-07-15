import { Octokit } from "@octokit/rest"

const inTests = typeof jest !== "undefined"
if (!inTests) {
  if (!process.env.GITHUB_TOKEN && !process.env.GITHUB_API_TOKEN)
    throw new Error(`There isn't a GITHUB_API_TOKEN in your env, found: ${Object.keys(process.env)}`)
}

export const createGitHubClient = () =>
  new Octokit({ auth: process.env.GITHUB_TOKEN ?? process.env.GITHUB_API_TOKEN ?? "example-token" })

import { Octokit } from "@octokit/rest"
import { Logger } from "../util/logger"
let cachedTSTeam: string[] = []

/** Checks if someone is a member of a team, and always bails with TS bot */
export const isMemberOfTSTeam = async (username: string, api: Octokit, _log: Logger) => {
  if (username === "typescript-bot") return false
  // Keep a cache so that it's only grabbed every so often
  if (cachedTSTeam.length) {
    return cachedTSTeam.includes(username)
  }

  const contentResponse = await api.repos.getContent({
    path: ".github/pr_owners.txt",
    repo: "TypeScript",
    owner: "Microsoft",
  })

  // @ts-ignore types are mismatched
  const usersText = Buffer.from(contentResponse.data.content, "base64").toString()
  cachedTSTeam = usersText.split("\n")

  return cachedTSTeam.includes(username)
}

import Octokit = require("@octokit/rest");

let cachedTSTeam: string [] = []

/** Checks if someone is a member of a team, and always bails with TS bot */
export const isMemberOfTSTeam = async (username: string, api: Octokit) => {
  if (username === "typescript-bot") return false;
  if (cachedTSTeam) {
    return cachedTSTeam.includes(username)
  }
  
  const contentResponse = await api.repos.getContents({ path: ".github/pr_owners.txt", repo: "TypeScript", owner: "Microsoft" })
  // @ts-ignore types are mismatched
  const usersText = Buffer.from(contentResponse.data.contents , 'base64').toString()
  cachedTSTeam = usersText.split("\n")

  return cachedTSTeam.includes(username)
}

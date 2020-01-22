import Octokit = require("@octokit/rest");

export const isMemberOfTypeScriptTeam = async (username: string, api: Octokit) => 
  isMemberOfTeam(username, "Microsoft", "typescript", api)

/** Checks if someone is a member of a team, and always bails with TS bot */
export const isMemberOfTeam = async (username: string, org:string, team_slug: string, api: Octokit) => {
  if (username === "typescript-bot") return false;

  const teamResponse = await api.teams.getByName({ org, team_slug })
  const team_id = teamResponse.data.id

  try {
    await api.teams.getMembership({ team_id, username})
    return true
  } catch (error) {
    return false
  }
}

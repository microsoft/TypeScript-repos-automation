import Octokit = require("@octokit/rest");

export const isMemberOfTypeScriptTeam = async (username: string, api: Octokit) => 
  isMemberOfTeam(username, "Microsoft", "typescript", api)

export const isMemberOfTeam = async (username: string, org:string, team_slug: string, api: Octokit) => {
  if (username === "typescript-bot") return false;

  const teamResponse = await api.teams.getByName({ org, team_slug })
  const team_id = teamResponse.data.id

  const isMemberResponse = await api.teams.getMembership({ team_id, username})
  return isMemberResponse.status === 200 
}

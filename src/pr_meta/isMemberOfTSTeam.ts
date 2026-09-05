import { Octokit } from "@octokit/rest"
import { Logger } from "../util/logger.js"
import { isTypeScriptBot } from "../util/botUsers.js"

function isHttpErrorWithStatus(error: unknown, status: number): boolean {
  return typeof error === "object"
    && error !== null
    && "status" in error
    && error.status === status
}

/** Checks if someone is a member of a team, and always bails with TS bot */
export const isMemberOfTSTeam = async (username: string, api: Octokit, _log: Logger) => {
  if (isTypeScriptBot(username)) return false

  try {
    const response = await api.teams.getMembershipForUserInOrg({
      org: "microsoft",
      team_slug: "typescript",
      username,
    })
    return response.data.state === "active"
  } catch (error) {
    if (isHttpErrorWithStatus(error, 404)) {
      return false
    }
    throw error
  }
}

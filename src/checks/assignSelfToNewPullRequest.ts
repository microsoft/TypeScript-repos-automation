import { WebhookPayloadPullRequest } from "@octokit/webhooks";
import * as Octokit from "@octokit/rest";
import {isMemberOfTypeScriptTeam} from "../pr_meta/isMemberOfTeam"
import { Logger } from "@azure/functions";

/**
 * If the PR comes from a core contributor, set themselves to be the assignee 
 * if one isn't set during the creation of the PR.
 */
export const assignSelfToNewPullRequest = async (api: Octokit, payload: WebhookPayloadPullRequest, logger: Logger) => {
  const { repository: repo, pull_request } = payload;
  if (pull_request.assignees.length > 0) {
    return logger("Skipping because there are assignees already")
  }

  const author = pull_request.user;

  const thisIssue = {
    repo: repo.name,
    owner: repo.owner.login,
    id: pull_request.number,
    issue_number: pull_request.number
  };

  // Check the access level of the user
  const isTeamMember = await isMemberOfTypeScriptTeam(author.login, api);
  if (isTeamMember) {
    logger(`Adding ${author.login} as the assignee`)
    await api.issues.addAssignees({ ...thisIssue, assignees: [author.login] });
  } else {
    logger(`Skipping because they are not a TS team member`)

  }
};

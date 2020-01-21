import { WebhookPayloadPullRequest } from "@octokit/webhooks";
import * as Octokit from "@octokit/rest";
import {isMemberOfTypeScriptTeam} from "../pr_meta/isMemberOfTeam"

/**
 * If the PR comes from a core contributor, set themselves to be the assignee 
 * if one isn't set during the creation of the PR.
 */
export const assignSelfToNewPullRequest = async (api: Octokit, payload: WebhookPayloadPullRequest) => {
  const { repository: repo, pull_request } = payload;
  if (pull_request.assignees.length > 0) {
    return;
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
  const isTSBot = payload.sender.login === "typescript-bot";

  // This may be too lax, if so, it can be switched to checking a GitHub team
  const isTSTeamMember = isTeamMember && !isTSBot;
  if (isTSTeamMember) {
    await api.issues.addAssignees({ ...thisIssue, assignees: [author.login] });
  }
};

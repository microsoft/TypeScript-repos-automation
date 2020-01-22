import { WebhookPayloadPullRequest } from "@octokit/webhooks";
import * as Octokit from "@octokit/rest";
import {isMemberOfTSTeam} from "../pr_meta/isMemberOfTSTeam"
import { Logger } from "@azure/functions";

/**
 * If the PR comes from a core contributor, set themselves to be the assignee 
 * if one isn't set during the creation of the PR.
 */
export const assignSelfToNewPullRequest = async (api: Octokit, payload: WebhookPayloadPullRequest, logger: Logger) => {
  const { repository: repo, pull_request } = payload;
  if (pull_request.assignees.length > 0) {
    return logger.info("Skipping because there are assignees already")
  }

  const author = pull_request.user;

  const thisIssue = {
    repo: repo.name,
    owner: repo.owner.login,
    id: pull_request.number,
    issue_number: pull_request.number
  };

  // Check the access level of the user
  const isTeamMember = await isMemberOfTSTeam(author.login, api, logger);
  if (isTeamMember) {
    logger.info(`Adding ${author.login} as the assignee`)
    await api.issues.addAssignees({ ...thisIssue, assignees: [author.login] });
  } else {
    logger.info(`Skipping because they are not a TS team member`)

  }
};

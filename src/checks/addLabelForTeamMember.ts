import { WebhookPayloadPullRequest } from "@octokit/webhooks";
import * as Octokit from "@octokit/rest";
import { isMemberOfTypeScriptTeam } from "../pr_meta/isMemberOfTeam";
import type { Logger } from "@azure/functions";

/**
 * If the PR comes from a core contributor, add a label to indicate it came from a maintainer
 */
export const addLabelForTeamMember = async (api: Octokit, payload: WebhookPayloadPullRequest, logger: Logger) => {
  const { repository: repo, pull_request } = payload;

  // Check the access level of the user
  const isTeamMember = await isMemberOfTypeScriptTeam(pull_request.user.login, api);
  if (!isTeamMember) {
    return logger.info(`Skipping because ${pull_request.user.login} is not a member of the TS team`)
  }

  // Add the label
  await api.issues.addLabels({ labels: ["Author: Team"], repo: repo.name, owner: repo.owner.login, issue_number: pull_request.id });
  logger.info("Added labels to PR")
};

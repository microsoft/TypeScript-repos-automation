import { WebhookPayloadPullRequest } from "@octokit/webhooks";
import * as Octokit from "@octokit/rest";
import { isMemberOfTypeScriptTeam } from "../pr_meta/isMemberOfTeam";

/**
 * If the PR comes from a core contributor, add a label to indicate it came from a maintainer
 */
export const addLabelForTeamMember = async (api: Octokit, payload: WebhookPayloadPullRequest) => {
  const { repository: repo, pull_request } = payload;

  // Check the access level of the user
  const isTeamMember = await isMemberOfTypeScriptTeam(pull_request.user.login, api);
  if (!isTeamMember) return;

  // Add the label
  await api.issues.addLabels({ labels: ["Author: Team"], repo: repo.name, owner: repo.owner.login, issue_number: pull_request.id });
};

import { IssuesEvent } from "@octokit/webhooks-types";
import { Octokit } from "@octokit/rest";
import { Logger } from "../util/logger.js";
import { getRelatedPRs } from "../issue_meta/getRelatedPRs.js";
import { getRelatedIssues } from "../pr_meta/getRelatedIssues.js";
import { syncMilestoneLabels } from "./syncMilestoneLabels.js";

const classificationActions = new Set<IssuesEvent["action"]>([
  "milestoned",
  "demilestoned",
  "assigned",
  "unassigned",
]);

export const addMilestoneLabelsToRelatedPRs = async (
  api: Octokit,
  payload: IssuesEvent,
  logger: Logger
) => {
  if (!classificationActions.has(payload.action)) {
    return logger.info("Skipping because this action doesn't affect milestone classification");
  }
  if (payload.issue.state !== "open") {
    return logger.info("Skipping because the issue is already closed");
  }
  const { repository: repo, issue } = payload;

  const prs = await getRelatedPRs(
    repo.owner.login,
    repo.name,
    issue.number,
    api
  );

  for (const pr of prs) {
    const relatedIssues = await getRelatedIssues(
      repo.owner.login,
      repo.name,
      pr.number,
      api
    );
    await syncMilestoneLabels(
      api,
      repo.owner.login,
      repo.name,
      pr.number,
      pr.labels,
      relatedIssues
    );
  }
};

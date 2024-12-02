import { IssuesEvent } from "@octokit/webhooks-types";
import { Octokit } from "@octokit/rest";
import { Logger } from "../util/logger";
import { getRelatedPRs } from "../issue_meta/getRelatedPRs";

export const addMilestoneLabelsToRelatedPRs = async (
  api: Octokit,
  payload: IssuesEvent,
  logger: Logger
) => {
  if (payload.action !== "milestoned") {
    return logger.info("Skipping because this action isn't adding a milestone");
  }
  if (payload.issue.state !== "open") {
    return logger.info("Skipping because the issue is already closed");
  }
  const { repository: repo, issue } = payload;

  const houseKeepingLabels = {
    "For Milestone Bug": false,
    "For Backlog Bug": false,
  };

  type HouseKeepingKeys = keyof typeof houseKeepingLabels;
  /**
   * For Milestone Bug -- fixes an issue that's in a version milestone, or assigned to a team member
   * For Backlog Bug -- fixes an issue that's in the Backlog milestone.
   * For Uncommitted Bug -- any other PR.
   */
  const milestone = payload.issue.milestone!;
  if (milestone.title !== "Backlog" || issue.assignees?.length) {
    houseKeepingLabels["For Milestone Bug"] = true;
  } else {
    houseKeepingLabels["For Backlog Bug"] = true;
  }

  const labelsNeedingToAdd = Object.keys(houseKeepingLabels).filter(
    (l) => houseKeepingLabels[l as HouseKeepingKeys]
  );

  const prs = await getRelatedPRs(
    repo.owner.login,
    repo.name,
    issue.number,
    api
  );

  for (const pr of prs) {
    const labels = labelsNeedingToAdd.filter((l) => !pr.labels.includes(l));
    if (!labels.length) {
      continue;
    }
    if (pr.labels.includes("For Uncommitted Bug")) {
      await api.issues.removeLabel({
        owner: repo.owner.login,
        repo: repo.name,
        issue_number: pr.number,
        name: "For Uncommitted Bug",
      });
    }
    await api.issues.addLabels({
      owner: repo.owner.login,
      repo: repo.name,
      issue_number: pr.number,
      labels,
    });
  }

  if (houseKeepingLabels["For Milestone Bug"]) {
    if (!issue.labels?.find((l) => l.name === "Fix Available")) {
      await api.issues.addLabels({
        owner: repo.owner.login,
        repo: repo.name,
        issue_number: issue.number,
        labels: ["Fix Available"],
      });
    }
  }
};

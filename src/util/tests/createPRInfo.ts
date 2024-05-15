import type { PRInfo } from "../../anyRepoHandlePullRequest"

export const createPRInfo = (info?: Partial<PRInfo>): PRInfo => {
  return {
    comments: [],
    authorIsMemberOfTSTeam: false,
    authorIsBot: false,
    relatedIssues: [],
    thisIssue: {
      issue_number: 35454,
      owner: "microsoft",
      repo: "TypeScript",
    },
    ...info
  }
}

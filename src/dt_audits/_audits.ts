import { DTPRContext } from "../pr_meta/getDTPRContext";
import { Context } from "@azure/functions";
import { isNewDTModule } from "./isNewDTModule";
import { allChangesAreTests } from "./allChangesAreTests";
import { allChangesToDTSFilesAreAdditions } from "./allChangesToDTSFilesAreAdditions";

export type AuditResult = {
  // n/a = Should not affect pass / fail
  // blocker = always fail if there is one of these
  // success = looking good
  result: "n/a" | "blocker" | "success";
  reason: string;
};

export interface Audit {
  displayName: string;
  run: (dt: DTPRContext, context: Context) => Promise<AuditResult>;
}

export type AuditFunc = () => Audit;

/**
 * Runs all the known audits 
 */
export const runAudits = async (dt: DTPRContext, context: Context) => {
  const audits = [isNewDTModule, allChangesAreTests, allChangesToDTSFilesAreAdditions];
  const results = [] as Array<{ name: string, result: AuditResult}>
  
  for (const auditFunc of audits) {
    const audit = auditFunc();
    const result = await audit.run(dt, context);
    results.push({ name: audit.displayName, result })
  }

  return results
};

import { AuditFunc } from "./_audits";

export const isNewDTModule: AuditFunc = () => ({
  displayName: "Ensure human review for new DT Module", 
  run: async (dt, _context) => {
    const onlyAdded = dt.files.added.length && dt.files.changed.length === 0 && dt.files.deleted.length === 0
    const isOneDTModule = dt.touchedModules.length === 1

    if (onlyAdded && isOneDTModule) {
      return {
        result: "blocker",
        reason: "This PR only creates new DT modules, and needs a human audit"
      }
    }

    return {
      result: "n/a",
      reason: "This PR does not create a new module"
    }
  }
})

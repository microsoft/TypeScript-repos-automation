import { AuditFunc } from "./_audits";

export const allChangesAreTests: AuditFunc = () => ({
  displayName: "Allows auto-merge when all file changes are tests",
  run: async (dt, _context) => {
    const editedFiles = [...dt.files.added, ...dt.files.changed];

    const removeAllowedFiles = (path: string) => !path.endsWith("tsconfig.json") && !path.endsWith("tslint.json");
    const isNotTest = (path: string) => !path.includes("-test.ts");

    const notTestFiles = editedFiles.filter(removeAllowedFiles).filter(isNotTest);

    const hasOnlyTestFiles = notTestFiles.length === 0;
    if (hasOnlyTestFiles) {
      return {
        result: "success",
        reason: "This PR only changes test files"
      };
    } else {
      return {
        result: "n/a",
        reason: "This PR changes more than just test files"
      };
    }
  }
});

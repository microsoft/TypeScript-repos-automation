import { AuditFunc } from "./_audits";

export const allChangesToDTSFilesAreAdditions: AuditFunc = () => ({
  displayName: "Allows auto-merge when all file changes are tests",
  run: async (dt, _context) => {
    // Get all changed files, then find the d.ts files
    const editedFiles = [...dt.files.added, ...dt.files.changed];
    const isDTSTest = (path: string) => path.endsWith(".d.ts");
    const dtsFiles = editedFiles.filter(isDTSTest)

    // Compare the check inside the diff to see if they have deletions
    const dtsFilesWithModifications = dtsFiles.filter(dts => {
      const diff = dt.diff.find(d => d.from === dts || d.to === dts)
      if (!diff) return true
            
      const onlyDeletions = diff.deletions === 0
      if (onlyDeletions) return false
      
      /**
       Specifically allow a change like:

      -// Type definitions for mongoose-paginate-v2 1.0
      +// Type definitions for mongoose-paginate-v2 1.3

       */
      const couldBeVersionBump = diff.deletions === 1
      if (couldBeVersionBump) {
        const deletion = diff.chunks.map(chunk => chunk.changes.find(c => c.type === 'del')).find(Boolean)
        if (deletion && deletion.content.includes(`// Type definitions for`)) {
          return false
        }
      }

      // Has deletions then
      return true
    })

    const hasAnyDTSFilesWithDeletions = dtsFilesWithModifications.length === 0;
    if (hasAnyDTSFilesWithDeletions) {
      return {
        result: "success",
        reason: "This PR has changes which are only additions to an existing DTS file"
      };
    } else {
      return {
        result: "n/a",
        reason: "This PR has dts files which are more than just additions"
      };
    }
  }
});

import parseDiff from "parse-diff"
import { Octokit } from "@octokit/rest"
import { InvocationContext } from "@azure/functions"
import { getCodeOwners, findMatchingOwners } from "./getCodeOwners"

type PullRequest = import("@octokit/rest").Octokit.PullsGetResponse

/** The context around which you can make decisions  */
export interface PRFilesContext {
  diffString: string
  diff: ReturnType<typeof parseDiff>
  files: {
    added: string[]
    changed: string[]
    deleted: string[]
  }
  pr: PullRequest
  touchedModules: Array<{
    name: string
    codeOwners: string[]
    files: string[]
  }>
}

export const getPRFileContext = async (
  api: Octokit,
  prNumber: number,
  context: InvocationContext
): Promise<PRFilesContext | undefined> => {
  const thisPR = { owner: "DefinitelyTyped", repo: "DefinitelyTyped", pull_number: prNumber }
  const diffHeaders = { accept: "application/vnd.github.v3.diff" }

  // The diff API specifically is an untyped edge-case in the octokit API, so a few coercions are needed
  const diffResponse = await api.pulls.get({ ...thisPR, headers: diffHeaders } as any)
  const diffString = (diffResponse.data as unknown) as string

  if (diffString === undefined) {
    context.error(`Could not get a diff for PR ${prNumber}`)
    return undefined
  }

  const diff = parseDiff(diffString)

  // Filters to the raw diff Files
  const added = diff.filter(diff => diff["new"])
  const deleted = diff.filter(diff => diff["deleted"])
  const changed = diff.filter(diff => !added.includes(diff) && !deleted.includes(diff))

  // Converts to just the names
  const files = {
    // The weird ending is a work-around for danger/danger-js#807 - it's less likely to hit us on here, but better to be safe
    added: added.map(d => d.to || (d.from && d.from.split(" b/")[0]) || "unknown"),
    changed: changed.map(d => d.to || "unknown"),
    deleted: deleted.map(d => d.from || "unknown"),
  }

  const filesInTypeModules = diff
    .map(d => d.to || (d.from && d.from.split(" b/")[0]))
    .filter(Boolean)
    .filter(path => path?.startsWith("types")) as string[]
  const projectNames = new Set(filesInTypeModules.map(p => p?.split("/")[1]))

  const allCodeOwners = await getCodeOwners(api)

  const touchedModules: PRFilesContext["touchedModules"] = Array.from(projectNames).map(name => {
    return {
      name: name,
      files: filesInTypeModules.filter(p => p.startsWith(`types/${name}`)),
      codeOwners: findMatchingOwners(name, allCodeOwners),
    }
  })

  const prResponse = await api.pulls.get(thisPR)
  const pr = prResponse.data

  return {
    diff,
    diffString,
    files,
    pr,
    touchedModules,
  }
}

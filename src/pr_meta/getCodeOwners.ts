import { Octokit } from "@octokit/rest"

/**
 * A map of path: [owners]
 *
 * Note that CodeOwners has paths starting with a /
 * whereas the GitHub API returns it without a slash prefix
 */
type CodeOwners = { [path: string]: string[] }

export const getCodeOwners = async (api: Octokit) => {
  const allCodeOwnersResponse = await api.repos.getContent({
    owner: "DefinitelyTyped",
    repo: "DefinitelyTyped",
    path: ".github/CODEOWNERS",
  })

  // @ts-ignore - types are mismatched
  const base64Content = allCodeOwnersResponse.data.content
  const raw = Buffer.from(base64Content, "base64").toString()

  const codeOwners = {} as CodeOwners

  // https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/.github/CODEOWNERS
  for (const line of raw.split(/\r?\n/g)) {
    if (line.trim().length === 0) continue
    const match = /^(\S+)\s+(.*)$/.exec(line)
    if (!match) throw new Error(`Expected the line from CODEOWNERS to match the regexp - ${line}`)
    codeOwners[match[1]] = match[2].split(" ").map(removeLeadingAt)
  }

  function removeLeadingAt(s: string) {
    if (s[0] === "@") return s.substr(1)
    return s
  }

  return codeOwners
}

/** Thought this would be complex (but it wasn't) */
export const findMatchingOwners = (path: string, codeOwners: CodeOwners) => codeOwners[`/types/${path}/`] ?? []

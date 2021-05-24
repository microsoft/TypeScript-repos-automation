import { Octokit } from "@octokit/rest"

// https://docs.github.com/en/enterprise/2.16/user/github/managing-your-work-on-github/closing-issues-using-keywords
const closePrefixes = ["close", "closes", "closed", "fix", "fixes", "fixed", "resolve", "resolves", "resolved"]

export const getRelatedIssues = async (body: string, owner: string, name: string, api: Octokit) => {
  const allFixedIssues = findIssuesInBody(body)
  const ourIssues = constrainIssuesToBaseRepo(allFixedIssues, `${owner}/${name}`)
  const issues: import("@octokit/rest").Octokit.IssuesGetResponse[] = []

  for (const issueNumber of ourIssues) {
    const response = await api.issues.get({ issue_number: Number(issueNumber), owner, repo: name })
    if (response.status === 200) {
      issues.push(response.data)
    }
  }
  return issues
}

export const findIssuesInBody = (body: string) => {
  const results: string[] = []
  const lowerBody = body.toLowerCase()
  closePrefixes.forEach(prefix => {
    if (lowerBody.includes(prefix)) {
      // https://regex101.com/r/sVT5QR/1
      // closes #45
      // closes: #45
      // closes Microsoft/TypeScript#45
      // closes: Microsoft/TypeScript#45
      const regex = new RegExp(`${prefix}:? (\\S*)`, "g")
      let match = regex.exec(lowerBody)
      while (match != null) {
        results.push(match[1])
        match = regex.exec(lowerBody)
      }
    }
  })

  return results
}

export const constrainIssuesToBaseRepo = (issues: string[], baseRepo: string): string[] => {
  const lowBase = baseRepo.toLowerCase()
  const lowUrl = `https://github.com/${lowBase}/issues/`
  return issues
    .map(r => {
      if (r.startsWith("#")) return r.slice(1)
      if (r.startsWith(lowBase)) return r.slice(lowBase.length + 1)
      if (r.startsWith(lowUrl)) return r.slice(lowUrl.length)
      return undefined
    })
    .filter(Boolean) as string[]
}

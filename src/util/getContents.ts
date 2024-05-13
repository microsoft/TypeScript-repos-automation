import { Octokit, RestEndpointMethodTypes } from "@octokit/rest"

export const getContents = async (api: Octokit, opts: RestEndpointMethodTypes["repos"]["getContent"]["parameters"]) => {
  const contentResponse = await api.repos.getContent(opts)
  // @ts-ignore types are mismatched
  const text = Buffer.from(contentResponse.data.content, "base64").toString()
  return text
}

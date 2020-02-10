import Octokit = require('@octokit/rest');

export const getContents = async (api: Octokit, opts: Octokit.ReposGetContentsParams) => {
  const contentResponse = await api.repos.getContents(opts)
// @ts-ignore types are mismatched
  const text = Buffer.from(contentResponse.data.content, 'base64').toString()
  return text
}

import { PRFilesContext, getPRFileContext } from "../../pr_meta/getPRFileContext";
import { Context } from "@azure/functions";
import { createMockGitHubClient, getPRFixture, convertToOctokitAPI } from "./createMockGitHubClient";
import { createMockContext } from "./createMockContext";

/**
 * Creates a version of the DT context object, with an API which lets you override any
 * specific part of the object you want. It's quite wordy to set up, so you can use 
 * `createDefaultMockDTContext` if you just need a high level tool
 *
 * @example
 * 
 *   const context = createMockContext()
 *   const mockAPI = createMockGitHubClient();
 * 
 *   // A diff, see https://patch-diff.githubusercontent.com/raw/DefinitelyTyped/DefinitelyTyped/pull/40896.diff
 *   mockAPI.pulls.get.mockResolvedValueOnce({ data: '' })
 *   
 *   // A PR, see https://api.github.com/repos/definitelytyped/definitelytyped/pulls/40896
 *   const pr = getPRFixture("opened")
 *   mockAPI.pulls.get.mockResolvedValueOnce(pr)
 *
 *   const api = convertToOctokitAPI(mockAPI);
 *   const dtContext = await createMockDTContext(api, context, {})
 */
export const createMockPRFileContext = async (api: import("@octokit/rest"), context: Context, overrides: Partial<PRFilesContext>) => {
  const defaultCodeowners = `
/types/lambda-tester/                                   @ivank @HajoAhoMantila @msuntharesan
/types/langmap/                                         @grabofus
/types/lasso/                                           @darkwebdev
/types/later/                                           @jasond-s
/types/latinize/                                        @GiedriusGrabauskas
/types/latlon-geohash/                                  @rimig
/types/launchpad/                                       @rictic
/types/layzr.js/                                        @shermendev
/types/lazy-property/                                   @jank1310
/types/lazy.js/                                         @Bartvds @miso440 @gablorquet
/types/lazypipe/                                        @tomc974
`
    let buff = Buffer.from(defaultCodeowners);
    let base64data = buff.toString('base64');
    
    // @ts-ignore
    api.repos.getContents.mockResolvedValueOnce({ data: { content: base64data} })
  const dtContext = await getPRFileContext(api, 9999, context);
  if (!dtContext) throw new Error("Did not create a DT context")

  return { ...dtContext, ...overrides}
};

/**
 * A default set of contextual objects for writing tests against. You can use the
 * partial object to override any results from the default setup
 */
export const createDefaultMockPRFileContext = async (overrides: Partial<PRFilesContext>, options?: { diff?: string, prFixture?: string}) => {
  const context = createMockContext()
  const {mockAPI} = createMockGitHubClient();
  // The diff
  mockAPI.pulls.get.mockResolvedValueOnce({ data: options?.diff ?? '' })
  // The PR
  const pr = getPRFixture(options?.prFixture as any ?? "opened")
  mockAPI.pulls.get.mockResolvedValueOnce(pr)

  const api = convertToOctokitAPI(mockAPI);
  const dt = await createMockPRFileContext(api, context, overrides)

  return {
    api,
    mockAPI,
    dt,
    context
  }
}

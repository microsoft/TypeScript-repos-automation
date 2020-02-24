jest.mock("../util/getContents");

import { createMockGitHubClient, getPRFixture } from "../util/tests/createMockGitHubClient";
import { getFakeLogger } from "../util/tests/createMockContext";

import { mergeThroughCodeOwners, mergePhrase } from "./mergeThroughCodeOwners";
import { getContents } from "../util/getContents";

const genericWebhook =   {
  comment: { 
    body: mergePhrase, 
    user: {
      login: "orta"
    }
  },
  issue: {
    number: 1234
  },
  repository: {
    owner: {
      login: "microsoft"
    },
    name: "TypeScript-Website"
  }
}

describe("for handling merging when green", () => {
  it("bails when the keyword aren't used", async () => {
    const { api } = createMockGitHubClient();
    const logger = getFakeLogger();

    await mergeThroughCodeOwners(api, { comment: { body: "Good Joke"} } as any, logger);
    expect(logger.info).toBeCalledWith("Issue comment did not include 'ready to merge', skipping merge through code owners checks");
  });

  it("handles the phrase in an issue", async () => {
    const { api, mockAPI } = createMockGitHubClient();
    mockAPI.pulls.get.mockRejectedValue(new Error("not found"))
    const logger = getFakeLogger();

    await mergeThroughCodeOwners(api, genericWebhook as any, logger);
    expect(logger.info).toBeCalledWith("Comment was in an issue");
  });

  it("handles the phrase in an pr", async () => {
    const { api, mockAPI } = createMockGitHubClient();
    const logger = getFakeLogger();
    const pr = getPRFixture("api-pr-closed")
    // @ts-ignore
    getContents.mockReturnValue("/hello.txt @orta")
    mockAPI.repos.getCombinedStatusForRef.mockResolvedValue({ data: { state: "success" }})

    // Getting the PR form the API
    mockAPI.pulls.get.mockResolvedValue({ data: pr })
    
    // Getting the files
    mockAPI.pulls.listFiles.endpoint.merge.mockResolvedValue({})
    mockAPI.paginate.mockResolvedValue([{ filename: "/hello.txt"}])

    await mergeThroughCodeOwners(api, genericWebhook as any, logger);

    expect(logger.info).toBeCalledWith("Accepting as reasonable to merge");
  });


  it("handles a complex regex and owner group in an pr", async () => {
    const { api, mockAPI } = createMockGitHubClient();
    const logger = getFakeLogger();
    const pr = getPRFixture("api-pr-closed")
    
    // @ts-ignore
    getContents.mockReturnValue(`
    /packages/playground-examples/copy/ja/** @sasurau4 @Quramy @Naturalclar @Takepepe @orta
    /packages/tsconfig-reference/copy/ja/** @sasurau4 @Quramy @Naturalclar @Takepepe @orta
    /packages/typescriptlang-org/src/copy/ja/** @sasurau4 @Quramy @Naturalclar @Takepepe @orta
    `)
    
    // Getting the PR form the API
    mockAPI.pulls.get.mockResolvedValue({ data: pr })
    mockAPI.repos.getCombinedStatusForRef.mockResolvedValue({ data: { state: "success" }})
    
    // Getting the files
    mockAPI.pulls.listFiles.endpoint.merge.mockResolvedValue({})
    mockAPI.paginate.mockResolvedValue([{ filename: "/packages/playground-examples/copy/ja/TypeScript/Primitives/Any.ts"}])

    await mergeThroughCodeOwners(api, genericWebhook as any, logger);

    expect(logger.info).toBeCalledWith("Accepting as reasonable to merge");
  });
});

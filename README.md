## Meta

* __State:__ In Production
* __Dashboard:__ [Azure](https://portal.azure.com/#@72f988bf-86f1-41af-91ab-2d7cd011db47/resource/subscriptions/57bfeeed-c34a-4ffd-a06b-ccff27ac91b8/resourceGroups/typescriptreposautomatio/providers/Microsoft.Web/sites/TypeScriptReposAutomation)

## Current Checks

#### Pull Requests

- Adds a label for any new PR by a core team member
- Assigns a core team member to their own PR if no-one is assigned

#### Issues

- NOOP for now, but set up

## Setup

This repo represents a single Azure "Function App" - which is an app which hosts many functions. 

```sh
# Clone
git clone https://github.com/microsoft/TypeScript-repos-automation.git repos-automation
cd repos-automation
npm install

# Validate
npm test
```

You should mostly work according to tests from the src repo, but you can start the server by running:

```sh
npm start
```

To do this you need to have the [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local) set up. Expect this install to take some time - it's the actual runtime used on the server in Azure.

Windows users:

```sh
npm install -g azure-functions-core-tools
```

Mac users:

```sh
brew tap azure/functions
brew install azure-functions-core-tools
```

Then you can use curl to send GitHub webhook JSON fixtures to the server:

```sh
curl -d "@fixtures/issues/created.json" -X POST http://localhost:7071/api/TypeScriptRepoIssueWebhook
```

While developing, you can use the `createFakeGitHubClient` to mock out the API with the responses you expect:

```diff
- import { createGitHubClient } from "./util/createGitHubClient";
+ import { createFakeGitHubClient } from "./util/tests/createMockGitHubClient";

export const handlePullRequestPayload = async (payload: WebhookPayloadPullRequest, context: Context) => {
-  const api = createGitHubClient();
+  const api = createGitHubClient();

  // Run checks
  await assignSelfToNewPullRequest(api, payload);

  context.res = {
    status: 200,
    body: "Success"
  };
};
```

# Deployment

PR's are automatically deployed when merged via GitHub Actions. 
If you'd like to manually deploy, you can use `npm run deploy`. Note: a manual deploy will nuke your `node_modules`.
 
# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

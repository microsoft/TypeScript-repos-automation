import { ManagedIdentityCredential } from "@azure/identity";
import { CryptographyClient } from "@azure/keyvault-keys";
import { Octokit } from "@octokit/rest";
import { createGitHubAppAuth } from "./github-app-auth.js";

type Permissions = Record<string, "read" | "write" | "admin">;
type GitHubAppAuth = ReturnType<typeof createGitHubAppAuth>;

type CachedClient = {
  token: string;
  api: Octokit;
};

const clients = new Map<string, CachedClient>();
let githubAuth: GitHubAppAuth | undefined;

function assertValue<T>(value: T | undefined, message: string): T {
  if (!value) {
    throw new Error(message);
  }
  return value;
}

function getGitHubAuth() {
  if (!githubAuth) {
    const keyId = assertValue(process.env.GITHUB_APP_KEY_VAULT_KEY_ID, "GITHUB_APP_KEY_VAULT_KEY_ID must be set");
    const cryptographyClient = new CryptographyClient(keyId, new ManagedIdentityCredential());
    githubAuth = createGitHubAppAuth({
      appClientId: assertValue(process.env.GITHUB_APP_CLIENT_ID, "GITHUB_APP_CLIENT_ID must be set"),
      signer: async (signingInput) => {
        const signature = await cryptographyClient.signData("RS256", Buffer.from(signingInput));
        return Buffer.from(signature.result).toString("base64url");
      },
      defaultOwner: "microsoft",
    });
  }
  return githubAuth;
}

function defaultPermissions(repo: string): Permissions {
  if (repo === "TypeScript-Make-Monaco-Builds") {
    return { contents: "write" };
  }
  return {
    contents: "write",
    issues: "write",
    pull_requests: "write",
  };
}

export async function createGitHubClient(owner = "microsoft", repo = "TypeScript", permissions = defaultPermissions(repo)) {
  const cacheKey = JSON.stringify({ owner, repo, permissions });
  const token = await getGitHubAuth().getToken({
    owner,
    repositories: [repo],
    permissions,
  });

  const cached = clients.get(cacheKey);
  if (cached && cached.token === token) {
    return cached.api;
  }

  const api = new Octokit({ auth: token });
  clients.set(cacheKey, { token, api });
  return api;
}

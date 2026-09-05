const typeScriptBotLogins = new Set(["typescript-bot", "typescript-automation[bot]"]);

export function isTypeScriptBot(login: string | undefined) {
  return isCopilot(login) || !!login && typeScriptBotLogins.has(login.toLowerCase());
}

export function isCopilot(login: string | undefined) {
  return login?.toLowerCase() === "copilot";
}

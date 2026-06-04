const typeScriptBotLogins = new Set(["typescript-bot", "typescript-automation[bot]"]);

export function isTypeScriptBot(login: string | undefined) {
  return !!login && typeScriptBotLogins.has(login.toLowerCase());
}

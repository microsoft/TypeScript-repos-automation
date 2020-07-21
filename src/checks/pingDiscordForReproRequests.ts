import { WebhookPayloadIssues } from "@octokit/webhooks"
import { Octokit } from "@octokit/rest"
import { Logger } from "@azure/functions"
import fetch from "node-fetch"

/**
 * Ping the discord channel when the label "Repro Requested" is added to an issue
 */
export const pingDiscordForReproRequests = async (api: Octokit, payload: WebhookPayloadIssues, logger: Logger) => {
  const { issue } = payload

  const label = (payload as any).label
  if (label && label.name && label.name === "Repro Requested") {
    
    // https://discord.com/developers/docs/resources/webhook#execute-webhook
    const body = stripBody(issue.body)

    logger.info("Sending Discord ping")
    await pingDiscord(`Repro requested on #${issue.number}`, {
      number: issue.number,
      title: issue.title,
      body: body,
      url: issue.html_url,
    })
  }
}

export const pingDiscord = async (msg: string, config: { number: number; title: string; body: string; url: string }) => {
  if (!process.env.REPRO_REQUEST_DISCORD_WEBHOOK) throw new Error("No process var for REPRO_REQUEST_DISCORD_WEBHOOK")

  const webhook = {
    content: msg,
    embeds: [
      {
        title: config.title,
        description: config.body.length === 200 ? config.body + "..." : config.body,
        url: config.url,
      },
    ],
  }

  await fetch(process.env.REPRO_REQUEST_DISCORD_WEBHOOK, {
    method: "POST",
    body: JSON.stringify(webhook),
    headers: { "Content-Type": "application/json" },
  })
}

export const stripBody = (str: string)=> {
  let body = str.slice(0, 199)
  // The template has comments which might have been kept in
  if (str.includes("𝗦𝗧𝗢𝗣") && str.includes("## Use Cases")) {
    // https://regex101.com/r/uEmvAZ/1
    const stripComments = /<!--[^>]*-->/g
    body = str.replace(stripComments, "").split("## Use Cases")[1].split("## Checklist")[0].slice(0, 199)
  }

  return body
}

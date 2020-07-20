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
    if (!process.env.REPRO_REQUEST_DISCORD_WEBHOOK) throw new Error("No process var for REPRO_REQUEST_DISCORD_WEBHOOK")

    // https://discord.com/developers/docs/resources/webhook#execute-webhook

    let body = issue.body.slice(0, 199)
    // The template has comments which might have been kept in
    if (issue.body.includes("𝗦𝗧𝗢𝗣") && issue.body.includes("## Use Cases")) {
      // https://regex101.com/r/uEmvAZ/1
      const stripComments = /<!--[^>]*-->/g
      body = issue.body.replace(stripComments, "").split("## Use Cases")[1].split("## Checklist")[0].slice(0, 199)
    }

    const webhook = {
      content: `Repro requested on #${issue.number}`,
      embeds: [
        {
          title: issue.title,
          description: body.length === 200 ? body + "..." : body,
          url: issue.html_url,
        },
      ],
    }

    logger.info("Sending Discord ping")
    fetch(process.env.REPRO_REQUEST_DISCORD_WEBHOOK, {
      method: "POST",
      body: JSON.stringify(webhook),
      headers: { "Content-Type": "application/json" },
    })
  }
}

import { Octokit } from "@octokit/rest"

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

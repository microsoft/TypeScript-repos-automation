import { getDTPRContext } from "../src/pr_meta/getDTPRContext";
import { createGitHubClient } from "../src/util/createGitHubClient";
import { createCLILogger } from "../src/util/createCLILogger";
import { Context } from "@azure/functions";
import { runAudits } from "../src/dt_audits/_audits";
import chalk from "chalk"

if (!process.argv[2]) {
  console.log("You need an arg for the PR number to run this: \n\n>  yarn ts-node -T scripts/generatePRReport.ts 40763\n\n");
  process.exit(1);
}

const run = async () => {
  const api = createGitHubClient();
  const context = ({ log: createCLILogger() } as unknown) as Context;

  const dtContext = await getDTPRContext(api, Number(process.argv[2]), context);
  if (!dtContext) throw new Error("Could not create a DT Context");

  console.log(`\nLooking at: #${dtContext.pr.number} - '${chalk.bold(dtContext.pr.title)}`)
  console.log(chalk.gray.underline(`// ${dtContext.pr.html_url}`))
  console.log(`\nRunning audits`)

  const audits = await runAudits(dtContext, context);
  console.log(audits);
};

run();

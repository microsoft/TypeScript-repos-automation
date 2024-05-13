import { Logger } from "./logger"

const cliLogger: Logger = {
  log: console.log,
  trace: console.trace,
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error
}

/** Returns a logger which conforms to the Azure logger interface */
export const createCLILogger = (): Logger => cliLogger

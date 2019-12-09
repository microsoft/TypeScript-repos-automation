import {Logger} from "@azure/functions"

const cliLogger = (...args: any[]) => {
  console.log(args)
}
cliLogger.error = console.error
cliLogger.warn = console.warn
cliLogger.info = console.info
cliLogger.verbose = console.info

/** Returns a logger which conforms to the Azure logger interface */
export const createCLILogger = (): Logger => cliLogger

import {Logger, Context} from "@azure/functions"


/** Returns a logger which conforms to the Azure logger interface */
export const getFakeLogger = (): Logger => {
  const cliLogger = jest.fn() as any
  cliLogger.error = jest.fn()
  cliLogger.warn = jest.fn()
  cliLogger.info = jest.fn()
  cliLogger.verbose = jest.fn()
  return cliLogger
}

/** 
 * Create a mock context which eats all logs, only contains the logging subset
 * for now, and should be extended if needed
 */
export const createMockContext = (): Context => ({
  log: getFakeLogger(),
} as any) 

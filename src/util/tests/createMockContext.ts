import { InvocationContext } from "@azure/functions"
import { Logger } from "../logger"

/** Returns a logger which conforms to the Azure logger interface */
export const getFakeLogger = (): Logger => {
  const cliLogger = jest.fn() as any as Logger
  cliLogger.log = jest.fn()
  cliLogger.trace = jest.fn()
  cliLogger.debug = jest.fn()
  cliLogger.info = jest.fn()
  cliLogger.warn = jest.fn()
  cliLogger.error = jest.fn()
  return cliLogger
}

/**
 * Create a mock context which eats all logs, only contains the logging subset
 * for now, and should be extended if needed
 */
export const createMockContext = (): InvocationContext =>
  (getFakeLogger() as Partial<InvocationContext> as InvocationContext)

import { vi } from "vitest"
import { InvocationContext } from "@azure/functions"
import { Logger } from "../logger.js"

/** Returns a logger which conforms to the Azure logger interface */
export const getFakeLogger = (): Logger => {
  const cliLogger = vi.fn() as any as Logger
  cliLogger.log = vi.fn()
  cliLogger.trace = vi.fn()
  cliLogger.debug = vi.fn()
  cliLogger.info = vi.fn()
  cliLogger.warn = vi.fn()
  cliLogger.error = vi.fn()
  return cliLogger
}

/**
 * Create a mock context which eats all logs, only contains the logging subset
 * for now, and should be extended if needed
 */
export const createMockContext = (): InvocationContext =>
  (getFakeLogger() as Partial<InvocationContext> as InvocationContext)

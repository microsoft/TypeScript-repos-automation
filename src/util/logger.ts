import { InvocationContext } from "@azure/functions";

export type Logger = Pick<InvocationContext, "log" | "trace" | "debug" | "info" | "warn" | "error">;

export type LogLevel = "error" | "warn";

export interface LogErrorOptions {
  level?: LogLevel;
}

/** The one place errors are logged. `context` says where it happened. */
export function logError(
  error: unknown,
  context: string,
  { level = "error" }: LogErrorOptions = {},
): void {
  const log = level === "warn" ? console.warn : console.error;
  log(`[${context}]`, error);
}

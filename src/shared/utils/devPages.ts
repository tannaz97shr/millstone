import "server-only";

/**
 * /dev pages (token and component previews) exist in development only. A
 * production build shows them only when built with DEV_PAGES=true, which
 * lets QA check a real production build of them.
 */
export function devPagesEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.DEV_PAGES === "true";
}

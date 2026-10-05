/**
 * Whether /dev pages (token, component and email previews) and the dev email
 * outbox are on, for an environment. On in development. A production build
 * shows them only when built and started with DEV_PAGES=true, for QA of a
 * real production build. Never on a Vercel production deployment, whatever
 * DEV_PAGES says.
 */
export function devPagesAllowed(env: Record<string, string | undefined>): boolean {
  if (env.VERCEL_ENV === "production") return false;
  return env.NODE_ENV !== "production" || env.DEV_PAGES === "true";
}

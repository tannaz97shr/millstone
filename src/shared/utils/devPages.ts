import "server-only";
import { devPagesAllowed } from "./devPagesPolicy";

/** /dev pages exist in development only (rules in devPagesPolicy.ts). */
export function devPagesEnabled(): boolean {
  return devPagesAllowed(process.env);
}

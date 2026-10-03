// How long a staff session lasts. One sign-in covers a whole shift; a tablet
// left signed in overnight asks again the next morning. The limit counts
// from sign-in and never slides, so an always-on counter tablet still expires.

export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

/** True once the session is past its fixed lifetime, or has no sign-in time. */
export function isSessionExpired(signedInAt: number | undefined, nowMs: number): boolean {
  if (typeof signedInAt !== "number" || !Number.isFinite(signedInAt)) return true;
  return nowMs - signedInAt > SESSION_MAX_AGE_SECONDS * 1000;
}
